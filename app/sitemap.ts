import type { MetadataRoute } from "next";
import { getProducts } from "@/lib/supabase/catalogue";

const siteUrl = "https://aurumentonet.co.ke";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = ["", "/shop", "/about", "/contact"].map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: new Date(),
  }));

  // A sitemap is best-effort SEO metadata, not core functionality — if Supabase is
  // unreachable at build/request time, ship the static routes rather than fail.
  try {
    const products = await getProducts();
    const productRoutes = products.map((p) => ({
      url: `${siteUrl}/shop/${p.slug}`,
      lastModified: new Date(p.createdAt),
    }));
    return [...staticRoutes, ...productRoutes];
  } catch {
    return staticRoutes;
  }
}
