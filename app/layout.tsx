import type { Metadata } from "next";
import "./globals.css";
import { fraunces, archivo } from "@/lib/fonts";
import { SiteShell } from "@/components/layout/SiteShell";
import { getActiveCategories } from "@/lib/supabase/catalogue";
import { getCartLines } from "@/lib/supabase/cart";
import { getWishlistProductIds } from "@/lib/supabase/wishlist";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { preloaderSkipScript } from "@/lib/preloader";

const siteUrl = "https://aurumentonet.co.ke";

// Every page shares this layout's nav (live categories), cart and wishlist — all
// read live from Supabase with no-store caching (see lib/supabase/public.ts), so
// nothing in this app is honestly static. Forcing dynamic rendering here, once,
// stops Next.js from attempting to prerender any page at build time — which is what
// crashed the build when Supabase env vars weren't available to the build step.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Aurum Entonet — A Handmade Story in Kenya",
    template: "%s — Aurum Entonet",
  },
  description:
    "Contemporary Kenyan jewellery, handmade and reimagined for today. Rings, earrings, bracelets and more — heritage translated into modern luxury.",
  openGraph: {
    title: "Aurum Entonet — A Handmade Story in Kenya",
    description:
      "Contemporary Kenyan jewellery, handmade and reimagined for today. Heritage translated into modern luxury.",
    url: siteUrl,
    siteName: "Aurum Entonet",
    locale: "en_KE",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Aurum Entonet — A Handmade Story in Kenya",
    description: "Contemporary Kenyan jewellery, handmade and reimagined for today.",
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // The whole site renders through this layout, so a Supabase hiccup here must never
  // crash every page — degrade to an empty nav/cart/wishlist instead of throwing.
  let user = null;
  let categories: Awaited<ReturnType<typeof getActiveCategories>> = [];
  let initialCartLines: Awaited<ReturnType<typeof getCartLines>> = [];
  let initialWishlistIds: string[] = [];

  if (isSupabaseConfigured()) {
    try {
      user = (await (await createClient()).auth.getUser()).data.user;
      [categories, initialCartLines, initialWishlistIds] = await Promise.all([
        getActiveCategories(),
        user ? getCartLines(user.id) : Promise.resolve([]),
        user ? getWishlistProductIds(user.id) : Promise.resolve([]),
      ]);
    } catch (error) {
      console.error("RootLayout: failed to load Supabase-backed data", error);
    }
  }

  return (
    // suppressHydrationWarning: the head script below may add data-ae-skip before hydration.
    <html lang="en" className={`${fraunces.variable} ${archivo.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: preloaderSkipScript }} />
        <noscript>
          <style>{".ae-preloader{display:none!important}html{overflow:auto!important}[data-intro-hold]{opacity:1!important}"}</style>
        </noscript>
      </head>
      <body className="bg-aurum-ivory text-aurum-obsidian antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[999] focus:bg-aurum-deep focus:px-4 focus:py-2 focus:text-aurum-ivory"
        >
          Skip to content
        </a>
        <SiteShell
          categories={categories}
          isAuthenticated={Boolean(user)}
          account={user ? { name: (user.user_metadata?.full_name as string | undefined) ?? (user.user_metadata?.name as string | undefined) ?? null, email: user.email ?? null } : null}
          initialCartLines={initialCartLines}
          initialWishlistIds={initialWishlistIds}
        >
          {children}
        </SiteShell>
      </body>
    </html>
  );
}
