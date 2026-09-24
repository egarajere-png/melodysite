"use server";

import { createClient } from "@/lib/supabase/server";
import { toggleWishlist, getWishlistProductIds } from "@/lib/supabase/wishlist";

export type WishlistActionResult = { ok: true; productIds: string[] } | { ok: false; error: string; signInRequired?: boolean };

async function requireCustomerId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function getWishlistAction(): Promise<WishlistActionResult> {
  const customerId = await requireCustomerId();
  if (!customerId) return { ok: true, productIds: [] };
  try {
    return { ok: true, productIds: await getWishlistProductIds(customerId) };
  } catch {
    return { ok: false, error: "Could not load your wishlist right now." };
  }
}

export async function toggleWishlistAction(productId: string): Promise<WishlistActionResult> {
  const customerId = await requireCustomerId();
  if (!customerId) return { ok: false, error: "Sign in to save pieces to your wishlist.", signInRequired: true };
  try {
    return { ok: true, productIds: await toggleWishlist(customerId, productId) };
  } catch {
    return { ok: false, error: "Could not update your wishlist." };
  }
}
