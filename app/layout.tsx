import type { Metadata } from "next";
import "./globals.css";
import { fraunces, archivo } from "@/lib/fonts";
import { SiteShell } from "@/components/layout/SiteShell";
import { getActiveCategories } from "@/lib/supabase/catalogue";

const siteUrl = "https://aurumentonet.co.ke";

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
  const categories = await getActiveCategories();
  return (
    <html lang="en" className={`${fraunces.variable} ${archivo.variable}`}>
      <body className="bg-aurum-ivory text-aurum-obsidian antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[999] focus:bg-aurum-deep focus:px-4 focus:py-2 focus:text-aurum-ivory"
        >
          Skip to content
        </a>
        <SiteShell categories={categories}>{children}</SiteShell>
      </body>
    </html>
  );
}
