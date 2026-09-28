import { createClient } from "@/lib/supabase/server";

export interface AdminCollection {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  productCount: number;
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export async function getAdminCollections(): Promise<AdminCollection[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("collections")
    .select("id, slug, name, description, product_collections ( product_id )")
    .eq("is_active", true)
    .order("sort_order");
  if (error) throw error;
  return (data ?? []).map((c) => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    description: c.description,
    productCount: (c.product_collections as unknown[]).length,
  }));
}

export async function createCollection(name: string, description: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("collections").insert({ slug: slugify(name), name, description: description || null });
  if (error) throw error;
}

/** Soft-delete: product_collections.collection_id references this with ON DELETE
 * RESTRICT, so a collection with products still linked can't be hard-deleted. */
export async function deactivateCollection(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("collections").update({ is_active: false }).eq("id", id);
  if (error) throw error;
}
