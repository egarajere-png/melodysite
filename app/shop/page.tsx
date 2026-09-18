import type { Metadata } from "next";
import { Suspense } from "react";
import { RevealText } from "@/components/motion/RevealText";
import { ShopClient } from "@/components/shop/ShopClient";
import { ProductGridSkeleton } from "@/components/ui/ProductGridSkeleton";

export const metadata: Metadata = {
  title: "Shop All",
  description: "Browse rings, earrings, bracelets, anklets and more from Aurum Entonet.",
};

export default function ShopPage() {
  return (
    <div className="pt-32 pb-24 sm:pt-40">
      <div className="container-aurum">
        <RevealText as="h1" text="Shop All" className="mb-10 font-display text-4xl sm:text-5xl" />
        <Suspense fallback={<ProductGridSkeleton />}>
          <ShopClient />
        </Suspense>
      </div>
    </div>
  );
}
