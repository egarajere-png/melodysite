import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { CategorySlug } from "@/lib/types";
import type { ProductKind } from "@/lib/supabase/database.types";

/**
 * Staff product catalogue management. RLS ("staff catalogue write" and friends)
 * restricts writes to is_staff(), so the cookie-based client is sufficient.
 *
 * Variants are never hard-deleted on edit: cart_items/order_items reference
 * product_variants with ON DELETE RESTRICT, so a variant a customer already has in
 * their cart or a past order can't be removed outright. Removing a variant in the
 * form sets is_active = false instead — the storefront already filters on that.
 */

export interface AdminProductListItem {
  id: string;
  slug: string;
  name: string;
  categoryName: string;
  price: number;
  totalStock: number;
  isActive: boolean;
}

export interface AdminVariantInput {
  id?: string; // present for an existing variant, absent for a new one
  sku: string;
  colour?: string;
  size?: string;
  stock: number;
}

export interface AdminProductInput {
  name: string;
  category: CategorySlug;
  collections: string[];
  productKind: ProductKind;
  description: string;
  careInstructions: string;
  shippingInfo: string;
  returnsInfo: string;
  materials: string[];
  price: number;
  costPrice: number;
  variants: AdminVariantInput[];
}

export interface AdminProductDetail extends AdminProductInput {
  id: string;
  slug: string;
  variants: (AdminVariantInput & { id: string })[];
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function getAdminProductList(): Promise<AdminProductListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      "id, slug, name, base_price, is_active, product_categories ( categories ( name ) ), product_variants ( is_active, inventory ( quantity_on_hand, quantity_reserved ) )"
    )
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((p) => {
    const variants = p.product_variants as unknown as { is_active: boolean; inventory: { quantity_on_hand: number; quantity_reserved: number } | null }[];
    const totalStock = variants
      .filter((v) => v.is_active)
      .reduce((sum, v) => sum + Math.max(0, (v.inventory?.quantity_on_hand ?? 0) - (v.inventory?.quantity_reserved ?? 0)), 0);
    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      categoryName: (p.product_categories as unknown as { categories: { name: string } | null }[])[0]?.categories?.name ?? "—",
      price: Number(p.base_price),
      totalStock,
      isActive: p.is_active,
    };
  });
}

export async function getAdminProduct(id: string): Promise<AdminProductDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      `id, slug, name, description, care_instructions, shipping_info, returns_info, base_price, cost_price, product_kind, materials,
       product_categories ( categories ( slug ) ),
       product_collections ( collections ( slug ) ),
       product_variants ( id, sku, is_active, inventory ( quantity_on_hand ), variant_option_values ( product_option_values ( value, product_options ( name ) ) ) )`
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const variants = (data.product_variants as unknown as {
    id: string;
    sku: string;
    is_active: boolean;
    inventory: { quantity_on_hand: number } | null;
    variant_option_values: { product_option_values: { value: string; product_options: { name: string } | null } | null }[];
  }[])
    .filter((v) => v.is_active)
    .map((v) => ({
      id: v.id,
      sku: v.sku,
      colour: v.variant_option_values.find((vov) => vov.product_option_values?.product_options?.name === "Colour")?.product_option_values?.value,
      size: v.variant_option_values.find((vov) => vov.product_option_values?.product_options?.name === "Size")?.product_option_values?.value,
      stock: v.inventory?.quantity_on_hand ?? 0,
    }));

  return {
    id: data.id,
    slug: data.slug,
    name: data.name,
    category: ((data.product_categories as unknown as { categories: { slug: string } | null }[])[0]?.categories?.slug ?? "") as CategorySlug,
    collections: (data.product_collections as unknown as { collections: { slug: string } | null }[]).map((pc) => pc.collections?.slug).filter((s): s is string => Boolean(s)),
    productKind: data.product_kind,
    description: data.description,
    careInstructions: data.care_instructions ?? "",
    shippingInfo: data.shipping_info ?? "",
    returnsInfo: data.returns_info ?? "",
    materials: data.materials,
    price: Number(data.base_price),
    costPrice: Number(data.cost_price ?? 0),
    variants,
  };
}

async function getOrCreateOptionValueId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  productId: string,
  optionName: "Colour" | "Size",
  value: string,
  displayOrder: number
): Promise<string> {
  let { data: option } = await supabase.from("product_options").select("id").eq("product_id", productId).eq("name", optionName).maybeSingle();
  if (!option) {
    const { data: created, error } = await supabase
      .from("product_options")
      .insert({ product_id: productId, name: optionName, display_order: optionName === "Colour" ? 0 : 1 })
      .select("id")
      .single();
    if (error) throw error;
    option = created;
  }

  let { data: optionValue } = await supabase.from("product_option_values").select("id").eq("option_id", option.id).eq("value", value).maybeSingle();
  if (!optionValue) {
    const { data: created, error } = await supabase
      .from("product_option_values")
      .insert({ option_id: option.id, value, display_order: displayOrder })
      .select("id")
      .single();
    if (error) throw error;
    optionValue = created;
  }
  return optionValue.id;
}

async function linkVariantOptionValues(
  supabase: Awaited<ReturnType<typeof createClient>>,
  productId: string,
  variantId: string,
  colour: string | undefined,
  size: string | undefined,
  index: number
) {
  await supabase.from("variant_option_values").delete().eq("variant_id", variantId);
  const links: string[] = [];
  if (colour) links.push(await getOrCreateOptionValueId(supabase, productId, "Colour", colour, index));
  if (size) links.push(await getOrCreateOptionValueId(supabase, productId, "Size", size, index));
  if (links.length) {
    await supabase.from("variant_option_values").insert(links.map((optionValueId) => ({ variant_id: variantId, option_value_id: optionValueId })));
  }
}

async function saveVariants(supabase: Awaited<ReturnType<typeof createClient>>, productId: string, variants: AdminVariantInput[]) {
  const keptIds: string[] = [];

  for (let i = 0; i < variants.length; i++) {
    const v = variants[i];
    if (v.id) {
      const { error } = await supabase.from("product_variants").update({ sku: v.sku, is_active: true }).eq("id", v.id);
      if (error) throw error;
      await supabase.from("inventory").update({ quantity_on_hand: v.stock }).eq("variant_id", v.id);
      await linkVariantOptionValues(supabase, productId, v.id, v.colour, v.size, i);
      keptIds.push(v.id);
    } else {
      const { data: created, error } = await supabase.from("product_variants").insert({ product_id: productId, sku: v.sku }).select("id").single();
      if (error) throw error;
      await supabase.from("inventory").insert({ variant_id: created.id, quantity_on_hand: v.stock });
      await linkVariantOptionValues(supabase, productId, created.id, v.colour, v.size, i);
      keptIds.push(created.id);
    }
  }

  // Soft-delete any existing variant the form no longer lists, rather than hard
  // deleting — a variant referenced by a past order or someone's current cart can't
  // be deleted outright (ON DELETE RESTRICT), and this preserves that history.
  const { data: existing } = await supabase.from("product_variants").select("id").eq("product_id", productId);
  const toDeactivate = (existing ?? []).map((e) => e.id).filter((id) => !keptIds.includes(id));
  if (toDeactivate.length) {
    await supabase.from("product_variants").update({ is_active: false }).in("id", toDeactivate);
  }
}

async function saveCategoryAndCollections(supabase: Awaited<ReturnType<typeof createClient>>, productId: string, category: CategorySlug, collectionSlugs: string[]) {
  const { data: categoryRow } = await supabase.from("categories").select("id").eq("slug", category).single();
  await supabase.from("product_categories").delete().eq("product_id", productId);
  if (categoryRow) await supabase.from("product_categories").insert({ product_id: productId, category_id: categoryRow.id });

  await supabase.from("product_collections").delete().eq("product_id", productId);
  if (collectionSlugs.length) {
    const { data: collectionRows } = await supabase.from("collections").select("id, slug").in("slug", collectionSlugs);
    if (collectionRows?.length) {
      await supabase.from("product_collections").insert(collectionRows.map((c) => ({ product_id: productId, collection_id: c.id })));
    }
  }
}

export async function createProduct(input: AdminProductInput): Promise<string> {
  const supabase = await createClient();
  const baseSlug = slugify(input.name) || "product";
  let slug = baseSlug;
  let attempt = 0;
  // Slugs are unique — fall back to a numbered suffix on collision.
  while (true) {
    const { data: existing } = await supabase.from("products").select("id").eq("slug", slug).maybeSingle();
    if (!existing) break;
    attempt += 1;
    slug = `${baseSlug}-${attempt + 1}`;
  }

  const { data: product, error } = await supabase
    .from("products")
    .insert({
      slug,
      name: input.name,
      description: input.description,
      care_instructions: input.careInstructions,
      shipping_info: input.shippingInfo,
      returns_info: input.returnsInfo,
      materials: input.materials,
      base_price: input.price,
      cost_price: input.costPrice,
      product_kind: input.productKind,
    })
    .select("id")
    .single();
  if (error) throw error;

  await saveCategoryAndCollections(supabase, product.id, input.category, input.collections);
  await saveVariants(supabase, product.id, input.variants);

  return product.id;
}

export async function updateProduct(id: string, input: AdminProductInput): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .update({
      name: input.name,
      description: input.description,
      care_instructions: input.careInstructions,
      shipping_info: input.shippingInfo,
      returns_info: input.returnsInfo,
      materials: input.materials,
      base_price: input.price,
      cost_price: input.costPrice,
      product_kind: input.productKind,
    })
    .eq("id", id);
  if (error) throw error;

  await saveCategoryAndCollections(supabase, id, input.category, input.collections);
  await saveVariants(supabase, id, input.variants);
}

export type DeleteProductOutcome = "deleted" | "archived";

/**
 * Removes a product for good. Past orders keep their line items (order_items has
 * ON DELETE SET NULL and stores its own name/price snapshot), wishlists and deal links
 * cascade, and variants/inventory/media rows cascade with the product.
 *
 * Two things need the service-role client, used only after the caller's staff check:
 * - other customers' cart_items (RLS only lets a customer see their own cart), which
 *   reference variants with ON DELETE RESTRICT and would otherwise block the delete;
 * - removing the product's uploaded files from Storage.
 *
 * If something else still holds a RESTRICT reference (e.g. an inventory_movements
 * audit row), the product is archived (is_active = false) instead so the history
 * stays intact — the caller is told which happened.
 */
export async function deleteProduct(id: string): Promise<DeleteProductOutcome> {
  const admin = createAdminClient();

  const [{ data: variants }, { data: media }] = await Promise.all([
    admin.from("product_variants").select("id").eq("product_id", id),
    admin.from("product_media").select("storage_path").eq("product_id", id),
  ]);

  const variantIds = (variants ?? []).map((v) => v.id);
  if (variantIds.length) {
    const { error } = await admin.from("cart_items").delete().in("variant_id", variantIds);
    if (error) throw error;
  }

  const { error } = await admin.from("products").delete().eq("id", id);
  if (error) {
    // 23503 = foreign_key_violation: something still references this product.
    if (error.code === "23503") {
      const { error: archiveError } = await admin.from("products").update({ is_active: false }).eq("id", id);
      if (archiveError) throw archiveError;
      return "archived";
    }
    throw error;
  }

  const storagePaths = (media ?? []).map((m) => m.storage_path).filter((p) => !p.startsWith("placeholder:"));
  if (storagePaths.length) {
    // Best-effort: the rows are already gone, so an orphaned file is harmless.
    await admin.storage.from("product-media").remove(storagePaths);
  }
  return "deleted";
}
