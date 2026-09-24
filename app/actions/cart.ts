"use server";

import { createClient } from "@/lib/supabase/server";
import * as cart from "@/lib/supabase/cart";
import type { CartLine } from "@/context/CartContext";

export type CartActionResult = { ok: true; lines: CartLine[] } | { ok: false; error: string; signInRequired?: boolean };

async function requireCustomerId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function getCartAction(): Promise<CartActionResult> {
  const customerId = await requireCustomerId();
  if (!customerId) return { ok: true, lines: [] };
  try {
    return { ok: true, lines: await cart.getCartLines(customerId) };
  } catch {
    return { ok: false, error: "Could not load your bag right now." };
  }
}

export async function addToCartAction(variantId: string, quantity: number): Promise<CartActionResult> {
  const customerId = await requireCustomerId();
  if (!customerId) return { ok: false, error: "Sign in to add pieces to your bag.", signInRequired: true };
  try {
    return { ok: true, lines: await cart.addToCart(customerId, variantId, quantity) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not add that piece to your bag." };
  }
}

export async function updateCartQuantityAction(variantId: string, quantity: number): Promise<CartActionResult> {
  const customerId = await requireCustomerId();
  if (!customerId) return { ok: false, error: "Sign in to manage your bag.", signInRequired: true };
  try {
    return { ok: true, lines: await cart.updateCartItemQuantity(customerId, variantId, quantity) };
  } catch {
    return { ok: false, error: "Could not update that quantity." };
  }
}

export async function removeCartItemAction(variantId: string): Promise<CartActionResult> {
  const customerId = await requireCustomerId();
  if (!customerId) return { ok: false, error: "Sign in to manage your bag.", signInRequired: true };
  try {
    return { ok: true, lines: await cart.removeCartItem(customerId, variantId) };
  } catch {
    return { ok: false, error: "Could not remove that item." };
  }
}

export async function clearCartAction(): Promise<CartActionResult> {
  const customerId = await requireCustomerId();
  if (!customerId) return { ok: true, lines: [] };
  await cart.clearCart(customerId);
  return { ok: true, lines: [] };
}
