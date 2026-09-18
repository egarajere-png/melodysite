import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/admin", "/checkout", "/orders", "/account"] },
    ],
    sitemap: "https://aurumentonet.co.ke/sitemap.xml",
  };
}
