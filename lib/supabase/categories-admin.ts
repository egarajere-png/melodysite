import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/slug";

/**
 * Staff management of shop categories. These drive the navbar Shop menu, the mobile
 * menu, the homepage "Shop by Category" tiles and the shop filters — all of which read
 * categories live via getActiveCategories(), so changes here show up site-wide.
 *
 * The slug is fixed at creation: it's in every /shop?category=… link and names the
 * category's tile image (/public/images/categories/<slug>.jpg), so renaming a
 * category changes only its display name.
 */

export interface AdminCategory {
  id: string;
  slug: string;
  name: string;
  isActive: boolean;
  sortOrder: number;
  productCount: number;
}

export class CategoryError extends Error {}

/** Case-insensitive exact match via ILIKE, with its wildcards escaped. */
function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (c) => `\\${c}`);
}

export async function getAdminCategories(): Promise<AdminCategory[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("categories").select("id, slug, name, is_active, sort_order, product_categories ( product_id )").order("sort_order").order("name");
  if (error) throw error;
  return (data ?? []).map((c) => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    isActive: c.is_active,
    sortOrder: c.sort_order,
    productCount: (c.product_categories as unknown[]).length,
  }));
}

export async function createCategory(name: string): Promise<void> {
  const slug = slugify(name);
  if (!slug) throw new CategoryError("Enter a category name with at least one letter or number.");
  const supabase = await createClient();
  const [{ data: slugClash }, { data: nameClash }] = await Promise.all([
    supabase.from("categories").select("id").eq("slug", slug).limit(1),
    supabase.from("categories").select("id").ilike("name", escapeLike(name)).limit(1),
  ]);
  if (slugClash?.length || nameClash?.length) throw new CategoryError(`A category called "${name}" already exists.`);
  const { data: last } = await supabase.from("categories").select("sort_order").order("sort_order", { ascending: false }).limit(1).maybeSingle();
  const { error } = await supabase.from("categories").insert({ slug, name, sort_order: (last?.sort_order ?? -1) + 1 });
  if (error) throw error;
}

export async function updateCategory(id: string, patch: { name?: string; isActive?: boolean }): Promise<void> {
  const supabase = await createClient();
  if (patch.name !== undefined) {
    const { data: clash } = await supabase.from("categories").select("id").ilike("name", escapeLike(patch.name)).neq("id", id).limit(1);
    if (clash?.length) throw new CategoryError(`A category called "${patch.name}" already exists.`);
  }
  const { error } = await supabase
    .from("categories")
    .update({ ...(patch.name !== undefined ? { name: patch.name } : {}), ...(patch.isActive !== undefined ? { is_active: patch.isActive } : {}) })
    .eq("id", id);
  if (error) throw error;
}

/** Swaps a category with its neighbour in the menu order. */
export async function moveCategory(id: string, direction: "up" | "down"): Promise<void> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("categories").select("id, sort_order").order("sort_order").order("name");
  if (error) throw error;
  const list = data ?? [];
  const index = list.findIndex((c) => c.id === id);
  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || swapWith < 0 || swapWith >= list.length) return;

  // Rewrite every position so duplicate/sparse sort_order values (e.g. from seeding)
  // can't make the swap a no-op.
  const reordered = [...list];
  [reordered[index], reordered[swapWith]] = [reordered[swapWith], reordered[index]];
  for (let i = 0; i < reordered.length; i++) {
    if (reordered[i].sort_order !== i) {
      const { error: updateError } = await supabase.from("categories").update({ sort_order: i }).eq("id", reordered[i].id);
      if (updateError) throw updateError;
    }
  }
}

/**
 * product_categories references categories with ON DELETE RESTRICT, so a category
 * that still has products needs somewhere for them to go first.
 */
export async function deleteCategory(id: string, moveProductsTo?: string): Promise<{ moved: number }> {
  const supabase = await createClient();
  const { data: links, error } = await supabase.from("product_categories").select("product_id").eq("category_id", id);
  if (error) throw error;
  const productIds = (links ?? []).map((l) => l.product_id);

  if (productIds.length) {
    if (!moveProductsTo || moveProductsTo === id) {
      throw new CategoryError(`This category still has ${productIds.length} product${productIds.length === 1 ? "" : "s"}. Choose a category to move them to first.`);
    }
    const { error: linkError } = await supabase
      .from("product_categories")
      .upsert(productIds.map((product_id) => ({ product_id, category_id: moveProductsTo })), { onConflict: "product_id,category_id", ignoreDuplicates: true });
    if (linkError) throw linkError;
    const { error: unlinkError } = await supabase.from("product_categories").delete().eq("category_id", id);
    if (unlinkError) throw unlinkError;
  }

  const { error: deleteError } = await supabase.from("categories").delete().eq("id", id);
  if (deleteError) throw deleteError;
  return { moved: productIds.length };
}

/** All categories (hidden ones labelled) for the product form's category select, so a
 * product in a hidden category isn't silently moved when it's saved. */
export async function getCategoryOptions(): Promise<{ slug: string; name: string; image: { id: string; alt: string } }[]> {
  const list = await getAdminCategories();
  return list.map((c) => ({ slug: c.slug, name: c.isActive ? c.name : `${c.name} (hidden)`, image: { id: `cat-${c.slug}`, alt: c.name } }));
}
