import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/slug";

/**
 * Staff management of collections (curated groups like "New Arrivals" or "Heritage").
 * Unlike categories, a product can be in any number of collections. The slug is fixed
 * at creation because it's in /shop?collection=… links.
 */

export interface AdminCollection {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  isActive: boolean;
  productIds: string[];
}

export interface CollectionInput {
  name: string;
  description: string;
  isActive: boolean;
  productIds: string[];
}

export class CollectionError extends Error {}

export async function getAdminCollections(): Promise<AdminCollection[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("collections")
    .select("id, slug, name, description, is_active, product_collections ( product_id )")
    .order("sort_order")
    .order("name");
  if (error) throw error;
  return (data ?? []).map((c) => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    description: c.description,
    isActive: c.is_active,
    productIds: (c.product_collections as { product_id: string }[]).map((pc) => pc.product_id),
  }));
}

async function setProducts(supabase: Awaited<ReturnType<typeof createClient>>, collectionId: string, productIds: string[]) {
  const { error } = await supabase.from("product_collections").delete().eq("collection_id", collectionId);
  if (error) throw error;
  if (productIds.length) {
    const { error: insertError } = await supabase.from("product_collections").insert(productIds.map((product_id) => ({ product_id, collection_id: collectionId })));
    if (insertError) throw insertError;
  }
}

async function assertNameFree(supabase: Awaited<ReturnType<typeof createClient>>, name: string, exceptId?: string) {
  let query = supabase.from("collections").select("id").ilike("name", name.replace(/[\\%_]/g, (c) => `\\${c}`)).limit(1);
  if (exceptId) query = query.neq("id", exceptId);
  const { data } = await query;
  if (data?.length) throw new CollectionError(`A collection called "${name}" already exists.`);
}

export async function createCollection(input: CollectionInput): Promise<string> {
  const slug = slugify(input.name);
  if (!slug) throw new CollectionError("Enter a collection name with at least one letter or number.");
  const supabase = await createClient();
  await assertNameFree(supabase, input.name);

  const { data: last } = await supabase.from("collections").select("sort_order").order("sort_order", { ascending: false }).limit(1).maybeSingle();
  const { data, error } = await supabase
    .from("collections")
    .insert({ slug, name: input.name, description: input.description || null, is_active: input.isActive, sort_order: (last?.sort_order ?? -1) + 1 })
    .select("id")
    .single();
  if (error) {
    if (error.code === "23505") throw new CollectionError(`A collection with the link name "${slug}" already exists — try a different name.`);
    throw error;
  }
  await setProducts(supabase, data.id, input.productIds);
  return data.id;
}

export async function updateCollection(id: string, input: CollectionInput): Promise<void> {
  const supabase = await createClient();
  await assertNameFree(supabase, input.name, id);
  const { error } = await supabase.from("collections").update({ name: input.name, description: input.description || null, is_active: input.isActive }).eq("id", id);
  if (error) throw error;
  await setProducts(supabase, id, input.productIds);
}

/** product_collections references collections with ON DELETE RESTRICT, so the
 * product links go first. The products themselves are untouched. */
export async function deleteCollection(id: string): Promise<void> {
  const supabase = await createClient();
  await setProducts(supabase, id, []);
  const { error } = await supabase.from("collections").delete().eq("id", id);
  if (error) throw error;
}

/** Every collection (hidden ones labelled) for the product form's collection picker —
 * the form rewrites a product's collection links on save, so it must be able to see
 * hidden collections too or saving would silently drop them. */
export async function getCollectionOptions(): Promise<{ slug: string; name: string }[]> {
  const list = await getAdminCollections();
  return list.map((c) => ({ slug: c.slug, name: c.isActive ? c.name : `${c.name} (hidden)` }));
}
