"use client";

import { useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { CartProvider } from "@/context/CartContext";
import { Navbar } from "@/components/layout/Navbar";
import { MenuOverlay } from "@/components/layout/MenuOverlay";
import { CustomCursor } from "@/components/layout/CustomCursor";
import { Preloader } from "@/components/layout/Preloader";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { PageTransition } from "@/components/motion/PageTransition";
import { Footer } from "@/components/layout/Footer";
import type { Category } from "@/lib/types";

export function SiteShell({ children, categories }: { children: ReactNode; categories: Category[] }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  // The admin dashboard is a separate professional tool — it gets none of the
  // storefront's preloader, custom cursor, editorial nav/footer or cart drawer.
  if (pathname?.startsWith("/admin")) {
    return <>{children}</>;
  }

  return (
    <CartProvider>
      <Preloader />
      <CustomCursor />
      <Navbar onOpenMenu={() => setMenuOpen(true)} categories={categories} />
      <MenuOverlay open={menuOpen} onClose={() => setMenuOpen(false)} categories={categories} />
      <CartDrawer />
      <main id="main-content" className="flex min-h-dvh flex-col">
        <PageTransition>{children}</PageTransition>
      </main>
      <Footer />
    </CartProvider>
  );
}
