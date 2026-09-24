"use client";

import { createContext, useContext, useState, useTransition, type ReactNode } from "react";
import { toggleWishlistAction } from "@/app/actions/wishlist";

interface WishlistContextValue {
  productIds: Set<string>;
  isAuthenticated: boolean;
  isPending: boolean;
  signInRequired: boolean;
  dismissSignInPrompt: () => void;
  isWishlisted: (productId: string) => boolean;
  toggle: (productId: string) => void;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({
  children,
  isAuthenticated,
  initialProductIds,
}: {
  children: ReactNode;
  isAuthenticated: boolean;
  initialProductIds: string[];
}) {
  const [productIds, setProductIds] = useState(new Set(initialProductIds));
  const [signInRequired, setSignInRequired] = useState(false);
  const [isPending, startTransition] = useTransition();

  function toggle(productId: string) {
    if (!isAuthenticated) {
      setSignInRequired(true);
      return;
    }
    // Optimistic flip — reconciled with the server's actual result right after.
    setProductIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
    startTransition(async () => {
      const result = await toggleWishlistAction(productId);
      if (result.ok) setProductIds(new Set(result.productIds));
      else if (result.signInRequired) setSignInRequired(true);
    });
  }

  const value: WishlistContextValue = {
    productIds,
    isAuthenticated,
    isPending,
    signInRequired,
    dismissSignInPrompt: () => setSignInRequired(false),
    isWishlisted: (productId) => productIds.has(productId),
    toggle,
  };

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
}
