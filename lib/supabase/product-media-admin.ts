import { createClient } from "@/lib/supabase/server";
import { PRODUCT_MEDIA_BUCKET, isPlaceholderPath, productMediaUrl } from "@/lib/product-media";

/**
 * Staff management of a product's photos. Files are uploaded by the browser straight
 * to Storage (staff-only insert policy on the product-media bucket); this module only
 * records/removes the product_media rows and cleans up files. RLS ("staff media
 * write", "staff product media delete") limits all of it to is_staff().
 *
 * Slots, matching how lib/supabase/catalogue.ts reads them back:
 * - main:    PRODUCT, no variant, is_primary — the first image everywhere (one per product)
 * - hover:   WORN, no variant — swapped in on hover (one per product)
 * - gallery: PRODUCT, no variant, not primary — extra colour-independent views
 * - colour:  PRODUCT pinned to a variant — shown when that variant's colour is picked
 */

export type MediaSlot = "main" | "hover" | "gallery" | "colour";

export interface AdminMediaItem {
  id: string;
  url: string;
  alt: string;
}

export interface AdminColourGroup {
  colour: string;
  /** An active variant of this colour that new uploads are pinned to; null if no active variant has this colour any more. */
  variantId: string | null;
  images: AdminMediaItem[];
}

export interface AdminProductMedia {
  main: AdminMediaItem | null;
  hover: AdminMediaItem | null;
  gallery: AdminMediaItem[];
  colours: AdminColourGroup[];
}

type OptionLinks = { product_option_values: { value: string; product_options: { name: string } | null } | null }[];

function colourOf(links: OptionLinks | undefined): string | undefined {
  return links?.find((l) => l.product_option_values?.product_options?.name === "Colour")?.product_option_values?.value;
}

export async function getAdminProductMedia(productId: string): Promise<AdminProductMedia> {
  const supabase = await createClient();
  const [{ data: mediaRows, error }, { data: variantRows, error: variantError }] = await Promise.all([
    supabase
      .from("product_media")
      .select("id, storage_path, alt_text, media_kind, is_primary, sort_order, variant_id, product_variants ( variant_option_values ( product_option_values ( value, product_options ( name ) ) ) )")
      .eq("product_id", productId)
      .order("sort_order"),
    supabase
      .from("product_variants")
      .select("id, is_active, created_at, variant_option_values ( product_option_values ( value, product_options ( name ) ) )")
      .eq("product_id", productId)
      .order("created_at"),
  ]);
  if (error) throw error;
  if (variantError) throw variantError;

  const result: AdminProductMedia = { main: null, hover: null, gallery: [], colours: [] };
  const groups = new Map<string, AdminColourGroup>();

  // One group per colour that's currently on sale, in variant order.
  for (const v of variantRows ?? []) {
    if (!v.is_active) continue;
    const colour = colourOf(v.variant_option_values as unknown as OptionLinks);
    if (colour && !groups.has(colour)) groups.set(colour, { colour, variantId: v.id, images: [] });
  }

  const rows = (mediaRows ?? []) as unknown as {
    id: string;
    storage_path: string;
    alt_text: string | null;
    media_kind: string;
    is_primary: boolean;
    variant_id: string | null;
    product_variants: { variant_option_values: OptionLinks } | null;
  }[];

  for (const m of rows) {
    if (isPlaceholderPath(m.storage_path)) continue;
    const item: AdminMediaItem = { id: m.id, url: productMediaUrl(m.storage_path), alt: m.alt_text ?? "" };
    if (m.variant_id) {
      const colour = colourOf(m.product_variants?.variant_option_values) ?? "No colour";
      // Images whose colour no longer has an active variant still show up (with no
      // upload target) so staff can see and delete them rather than lose track.
      if (!groups.has(colour)) groups.set(colour, { colour, variantId: null, images: [] });
      groups.get(colour)!.images.push(item);
    } else if (m.media_kind === "WORN") {
      result.hover ??= item;
    } else if (m.is_primary && !result.main) {
      result.main = item;
    } else {
      result.gallery.push(item);
    }
  }

  result.colours = Array.from(groups.values());
  return result;
}

async function removeRows(supabase: Awaited<ReturnType<typeof createClient>>, rows: { id: string; storage_path: string }[]) {
  if (!rows.length) return;
  const { error } = await supabase.from("product_media").delete().in("id", rows.map((r) => r.id));
  if (error) throw error;
  const paths = rows.map((r) => r.storage_path).filter((p) => !isPlaceholderPath(p));
  // Best-effort: once the rows are gone an orphaned file is harmless.
  if (paths.length) await supabase.storage.from(PRODUCT_MEDIA_BUCKET).remove(paths);
}

async function nextSortOrder(supabase: Awaited<ReturnType<typeof createClient>>, productId: string): Promise<number> {
  const { data } = await supabase.from("product_media").select("sort_order").eq("product_id", productId).order("sort_order", { ascending: false }).limit(1).maybeSingle();
  return (data?.sort_order ?? 0) + 1;
}

export interface AddMediaInput {
  productId: string;
  slot: MediaSlot;
  storagePath: string;
  alt: string;
  variantId?: string;
}

export async function addProductMedia(input: AddMediaInput): Promise<void> {
  const supabase = await createClient();

  // The browser chose the path; only accept files inside this product's own folder.
  if (!input.storagePath.startsWith(`products/${input.productId}/`) || input.storagePath.includes("..")) {
    throw new Error("Invalid upload path.");
  }

  if (input.slot === "main" || input.slot === "hover") {
    const kind = input.slot === "main" ? "PRODUCT" : "WORN";
    let existing = supabase.from("product_media").select("id, storage_path").eq("product_id", input.productId).is("variant_id", null).eq("media_kind", kind);
    if (input.slot === "main") existing = existing.eq("is_primary", true);
    const { data: old } = await existing;
    await removeRows(supabase, old ?? []);

    const { error } = await supabase.from("product_media").insert({
      product_id: input.productId,
      storage_path: input.storagePath,
      alt_text: input.alt,
      media_kind: kind,
      is_primary: input.slot === "main",
      sort_order: 0,
    });
    if (error) throw error;
    return;
  }

  let variantId: string | null = null;
  if (input.slot === "colour") {
    const { data: variant } = await supabase.from("product_variants").select("id").eq("id", input.variantId ?? "").eq("product_id", input.productId).maybeSingle();
    if (!variant) throw new Error("That colour no longer belongs to this product.");
    variantId = variant.id;
  }

  const { error } = await supabase.from("product_media").insert({
    product_id: input.productId,
    variant_id: variantId,
    storage_path: input.storagePath,
    alt_text: input.alt,
    media_kind: "PRODUCT",
    is_primary: false,
    sort_order: await nextSortOrder(supabase, input.productId),
  });
  if (error) throw error;
}

export async function deleteProductMedia(productId: string, mediaId: string): Promise<void> {
  const supabase = await createClient();
  const { data } = await supabase.from("product_media").select("id, storage_path").eq("id", mediaId).eq("product_id", productId);
  await removeRows(supabase, data ?? []);
}

/** Moves an image to the front of its own group (colour gallery or extra images). */
export async function moveProductMediaFirst(productId: string, mediaId: string): Promise<void> {
  const supabase = await createClient();
  const { data: min } = await supabase.from("product_media").select("sort_order").eq("product_id", productId).order("sort_order").limit(1).maybeSingle();
  const { error } = await supabase
    .from("product_media")
    .update({ sort_order: (min?.sort_order ?? 0) - 1 })
    .eq("id", mediaId)
    .eq("product_id", productId);
  if (error) throw error;
}

/** Best-effort removal of a just-uploaded file whose database row could not be saved. */
export async function discardUploadedFile(productId: string, storagePath: string): Promise<void> {
  if (!storagePath.startsWith(`products/${productId}/`)) return;
  const supabase = await createClient();
  await supabase.storage.from(PRODUCT_MEDIA_BUCKET).remove([storagePath]);
}
