"use client";

import { createContext, useContext, useState, useTransition, type ReactNode } from "react";
import type { ImageRef } from "@/lib/types";
import { addToCartAction, updateCartQuantityAction, removeCartItemAction, clearCartAction } from "@/app/actions/cart";

export interface CartLine {
  productId: string;
  productSlug: string;
  variantId: string;
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
 * The cart is Supabase-backed and requires an authenticated customer (the schema's
 * `carts.customer_id` is not-null — there's no guest-cart concept). Mutations call
 * server actions that re-derive price and available stock themselves; whatever this
 * component passes in for those fields is only used for the instant local "Added"
 * flash, never trusted as the source of truth — `lines` is always replaced by
 * whatever the server actually persisted right after.
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
    startTransition(async () => {
      const result = await addToCartAction(line.variantId, quantity);
      if (result.ok) setLines(result.lines);
      else {
        setError(result.error);
        if (result.signInRequired) setSignInRequired(true);
      }
    });
  }

  function updateQuantity(variantId: string, quantity: number) {
    setError(null);
    startTransition(async () => {
      const result = await updateCartQuantityAction(variantId, quantity);
      if (result.ok) setLines(result.lines);
      else setError(result.error);
    });
  }

  function removeLine(variantId: string) {
    setError(null);
    startTransition(async () => {
      const result = await removeCartItemAction(variantId);
      if (result.ok) setLines(result.lines);
      else setError(result.error);
    });
  }

  function clearCart() {
    startTransition(async () => {
      await clearCartAction();
      setLines([]);
    });
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
