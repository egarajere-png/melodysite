"use client";

import { createContext, useContext, useEffect, useState, useTransition, type ReactNode } from "react";
import type { ImageRef } from "@/lib/types";
import { addToCartAction, updateCartQuantityAction, removeCartItemAction, clearCartAction, mergeGuestCartAction, type CartActionResult } from "@/app/actions/cart";
import { guestCart } from "@/lib/guest-storage";

export interface CartLine {
  productId: string;
  productSlug: string;
  variantId: string;
  sku: string;
  name: string;
  variantLabel: string;
  unitPrice: number;
  image: ImageRef;
  quantity: number;
  maxStock: number;
}

interface CartContextValue {
  lines: CartLine[];
  isOpen: boolean;
  isAuthenticated: boolean;
  isPending: boolean;
  signInRequired: boolean;
  error: string | null;
  openCart: () => void;
  closeCart: () => void;
  dismissSignInPrompt: () => void;
  addLine: (line: Omit<CartLine, "quantity">, quantity?: number) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  removeLine: (variantId: string) => void;
  clearCart: () => void;
  subtotal: number;
  count: number;
  lastAdded: CartLine | null;
}

const CartContext = createContext<CartContextValue | null>(null);

/**
 * The bag is saved to the customer's account (carts/cart_items), so adding to it
 * requires signing in — a signed-out visitor gets the sign-in panel in the drawer.
 * Mutations call server actions that re-derive price and stock themselves; `lines` is
 * always replaced by what the server actually persisted.
 *
 * Bags built as a guest (browser storage, from when guest shopping was allowed) are
 * moved into the account once, on first sign-in — repeat-safe on the server.
 */
export function CartProvider({
  children,
  isAuthenticated,
  initialLines,
}: {
  children: ReactNode;
  isAuthenticated: boolean;
  initialLines: CartLine[];
}) {
  const [lines, setLines] = useState<CartLine[]>(initialLines);
  const [isOpen, setIsOpen] = useState(false);
  const [lastAdded, setLastAdded] = useState<CartLine | null>(null);
  const [signInRequired, setSignInRequired] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!isAuthenticated) return;
    const stored = guestCart.read();
    if (stored.length === 0) return;
    // Clear first: if this request is cut off by a navigation the server may still
    // have merged, and the merge is repeat-safe anyway. Restore only on a clear failure.
    guestCart.clear();
    startTransition(async () => {
      const result = await mergeGuestCartAction(stored);
      if (result.ok) setLines(result.lines);
      else guestCart.write(stored);
    });
  }, [isAuthenticated]);

  function applyResult(result: CartActionResult) {
    if (result.ok) {
      setLines(result.lines);
    } else {
      setError(result.error);
      if (result.signInRequired) setSignInRequired(true);
    }
  }

  function addLine(line: Omit<CartLine, "quantity">, quantity = 1) {
    if (!isAuthenticated) {
      setSignInRequired(true);
      setIsOpen(true);
      return;
    }
    setError(null);
    setSignInRequired(false);
    setLastAdded({ ...line, quantity });
    setIsOpen(true);
    startTransition(async () => applyResult(await addToCartAction(line.variantId, quantity)));
  }

  function updateQuantity(variantId: string, quantity: number) {
    setError(null);
    startTransition(async () => applyResult(await updateCartQuantityAction(variantId, quantity)));
  }

  function removeLine(variantId: string) {
    setError(null);
    startTransition(async () => applyResult(await removeCartItemAction(variantId)));
  }

  function clearCart() {
    setLines([]);
    if (isAuthenticated) startTransition(async () => void (await clearCartAction()));
  }

  const subtotal = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
  const count = lines.reduce((sum, l) => sum + l.quantity, 0);

  const value: CartContextValue = {
    lines,
    isOpen,
    isAuthenticated,
    isPending,
    signInRequired,
    error,
    openCart: () => setIsOpen(true),
    closeCart: () => setIsOpen(false),
    dismissSignInPrompt: () => setSignInRequired(false),
    addLine,
    updateQuantity,
    removeLine,
    clearCart,
    subtotal,
    count,
    lastAdded,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
