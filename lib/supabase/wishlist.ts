import { createClient } from "@/lib/supabase/server";
import { getProducts } from "@/lib/supabase/catalogue";
import type { Product } from "@/lib/types";

/** RLS ("own wishlist"/"own wishlist items") restricts every query here to the
 * calling user's own wishlist, so the normal cookie-based client is sufficient. */

async function getOrCreateWishlistId(customerId: string): Promise<string> {
  const supabase = await createClient();
  const { data: existing } = await supabase.from("wishlists").select("id").eq("customer_id", customerId).maybeSingle();
  if (existing) return existing.id;
  const { data: created, error } = await supabase.from("wishlists").insert({ customer_id: customerId }).select("id").single();
  if (error) throw error;
  return created.id;
}

export async function getWishlistProductIds(customerId: string): Promise<string[]> {
  const supabase = await createClient();
  const { data: wishlist } = await supabase.from("wishlists").select("id").eq("customer_id", customerId).maybeSingle();
  if (!wishlist) return [];
  const { data: items, error } = await supabase.from("wishlist_items").select("product_id").eq("wishlist_id", wishlist.id);
  if (error) throw error;
  return (items ?? []).map((i) => i.product_id);
}

export async function getWishlistProducts(customerId: string): Promise<Product[]> {
  const ids = new Set(await getWishlistProductIds(customerId));
  if (ids.size === 0) return [];
  const all = await getProducts();
  return all.filter((p) => ids.has(p.id));
}

export async function toggleWishlist(customerId: string, productId: string): Promise<string[]> {
  const wishlistId = await getOrCreateWishlistId(customerId);
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("wishlist_items")
    .select("product_id")
    .eq("wishlist_id", wishlistId)
    .eq("product_id", productId)
    .maybeSingle();

  if (existing) {
    await supabase.from("wishlist_items").delete().eq("wishlist_id", wishlistId).eq("product_id", productId);
  } else {
    await supabase.from("wishlist_items").insert({ wishlist_id: wishlistId, product_id: productId });
  }
  return getWishlistProductIds(customerId);
}
