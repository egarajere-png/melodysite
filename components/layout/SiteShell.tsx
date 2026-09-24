"use client";

import { useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { CartProvider, type CartLine } from "@/context/CartContext";
import { WishlistProvider, useWishlist } from "@/context/WishlistContext";
import { Navbar } from "@/components/layout/Navbar";
import { MenuOverlay } from "@/components/layout/MenuOverlay";
import { CustomCursor } from "@/components/layout/CustomCursor";
import { Preloader } from "@/components/layout/Preloader";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { SignInPrompt } from "@/components/account/SignInPrompt";
import { PageTransition } from "@/components/motion/PageTransition";
import { Footer } from "@/components/layout/Footer";
import type { Category } from "@/lib/types";

/** Sits inside WishlistProvider so it can read/dismiss the shared sign-in modal —
 * a plain component can't consume the context it's also providing. */
function WishlistSignInPrompt() {
  const { signInRequired, dismissSignInPrompt } = useWishlist();
  return (
    <SignInPrompt
      open={signInRequired}
      onClose={dismissSignInPrompt}
      title="Sign in to save this piece."
      description="Your wishlist is saved to your account, so it's there whenever you come back."
    />
  );
}

export function SiteShell({
  children,
  categories,
  isAuthenticated,
  initialCartLines,
  initialWishlistIds,
}: {
  children: ReactNode;
  categories: Category[];
  isAuthenticated: boolean;
  initialCartLines: CartLine[];
  initialWishlistIds: string[];
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  // The admin dashboard is a separate professional tool — it gets none of the
  // storefront's preloader, custom cursor, editorial nav/footer or cart drawer.
  if (pathname?.startsWith("/admin")) {
    return <>{children}</>;
  }

  return (
    <CartProvider isAuthenticated={isAuthenticated} initialLines={initialCartLines}>
      <WishlistProvider isAuthenticated={isAuthenticated} initialProductIds={initialWishlistIds}>
        <Preloader />
        <CustomCursor />
        <Navbar onOpenMenu={() => setMenuOpen(true)} categories={categories} />
        <MenuOverlay open={menuOpen} onClose={() => setMenuOpen(false)} categories={categories} />
        <CartDrawer />
        <WishlistSignInPrompt />
        <main id="main-content" className="flex min-h-dvh flex-col">
          <PageTransition>{children}</PageTransition>
        </main>
        <Footer />
      </WishlistProvider>
    </CartProvider>
  );
}
