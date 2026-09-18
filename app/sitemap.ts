import type { MetadataRoute } from "next";
import { products } from "@/data/products";

const siteUrl = "https://aurumentonet.co.ke";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = ["", "/shop", "/about", "/contact"].map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: new Date(),
  }));

  const productRoutes = products.map((p) => ({
    url: `${siteUrl}/shop/${p.slug}`,
    lastModified: new Date(p.createdAt),
  }));

  return [...staticRoutes, ...productRoutes];
}
