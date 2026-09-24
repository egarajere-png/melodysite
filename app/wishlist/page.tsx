import type { Metadata } from "next";
import { RevealText } from "@/components/motion/RevealText";
import { ProductCard } from "@/components/product/ProductCard";
import { GoogleAuthButton } from "@/components/account/GoogleAuthButton";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getWishlistProducts } from "@/lib/supabase/wishlist";

export const metadata: Metadata = { title: "Wishlist", robots: { index: false, follow: false } };

export default async function WishlistPage() {
  const user = isSupabaseConfigured() ? (await (await createClient()).auth.getUser()).data.user : null;
  const products = user ? await getWishlistProducts(user.id) : [];

  return (
    <div className="pt-32 pb-24 sm:pt-40">
      <div className="container-aurum">
        <RevealText as="h1" text="Your Wishlist" className="mb-10 font-display text-4xl sm:text-5xl" />

        {!user ? (
          <div className="flex flex-col items-center gap-5 py-16 text-center">
            <p className="max-w-sm text-sm text-aurum-obsidian/60">Sign in to see the pieces you&apos;ve saved.</p>
            <GoogleAuthButton />
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <p className="text-sm text-aurum-obsidian/60">Nothing saved yet — tap the heart on any piece to add it here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-5 gap-y-12 sm:gap-x-8 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
