import type { Metadata } from "next";
import { RevealText } from "@/components/motion/RevealText";
import { ShopClient, type ShopFilters, type SortKey } from "@/components/shop/ShopClient";
import { getActiveCategories, getMaterialFinishes, getProducts, getActiveDeal } from "@/lib/supabase/catalogue";
import type { CategorySlug } from "@/lib/types";

export const metadata: Metadata = {
  title: "Shop All",
  description: "Browse rings, earrings, bracelets, anklets and more from Aurum Entonet.",
};

const PRICE_BANDS: Record<string, { min?: number; max?: number }> = {
  "under-2000": { max: 2000 },
  "under-5000": { max: 5000 },
  "over-5000": { min: 5000 },
};

function parseSort(raw: string | undefined): SortKey {
  if (raw === "new") return "newest";
  if (raw === "newest" || raw === "bestsellers" || raw === "price-asc" || raw === "price-desc") return raw;
  return "featured";
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

  const filters: ShopFilters = {
    category: (one(sp.category) as CategorySlug) || "all",
    kind: one(sp.kind) === "set" || one(sp.kind) === "piece" ? (one(sp.kind) as "set" | "piece") : "all",
    price: one(sp.price) && PRICE_BANDS[one(sp.price) as string] ? (one(sp.price) as string) : "all",
    finishes: one(sp.finish) ? (one(sp.finish) as string).split(",").filter(Boolean) : [],
    men: one(sp.men) === "1",
    dealOnly: one(sp.deal) === "true",
    inStockOnly: one(sp.stock) === "1",
    query: one(sp.q) ?? "",
    sort: parseSort(one(sp.sort)),
  };

  const priceBand = PRICE_BANDS[filters.price] ?? {};

  const [products, categories, materialFinishes, activeDeal] = await Promise.all([
    getProducts({
      category: filters.category === "all" ? undefined : filters.category,
      productKind: filters.kind === "set" ? "SET" : filters.kind === "piece" ? "INDIVIDUAL_PIECE" : undefined,
      materialFinishes: filters.finishes.length ? filters.finishes : undefined,
      audience: filters.men ? "men" : undefined,
      minPrice: priceBand.min,
      maxPrice: priceBand.max,
      inStockOnly: filters.inStockOnly || undefined,
      search: filters.query || undefined,
      dealOnly: filters.dealOnly || undefined,
      sort: filters.sort,
    }),
    getActiveCategories(),
    getMaterialFinishes(),
    getActiveDeal(),
  ]);

  return (
    <div className="pt-32 pb-24 sm:pt-40">
      <div className="container-aurum">
        <RevealText as="h1" text="Shop All" className="mb-10 font-display text-4xl sm:text-5xl" />
        <ShopClient
          products={products}
          categories={categories}
          materialFinishes={materialFinishes}
          filters={filters}
          hasActiveDeal={Boolean(activeDeal)}
        />
      </div>
    </div>
  );
}
