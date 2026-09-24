"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { SlidersHorizontal, Search, X } from "lucide-react";
import { ProductCard } from "@/components/product/ProductCard";
import type { Category, CategorySlug, Product } from "@/lib/types";

export type SortKey = "featured" | "newest" | "price-asc" | "price-desc" | "bestsellers";

export interface ShopFilters {
  category: CategorySlug | "all";
  kind: "set" | "piece" | "all";
  price: string; // "all" | "under-2000" | "under-5000" | "over-5000"
  finishes: string[];
  men: boolean;
  dealOnly: boolean;
  inStockOnly: boolean;
  query: string;
  sort: SortKey;
}

const SORT_LABELS: Record<SortKey, string> = {
  featured: "Featured",
  newest: "Newest",
  "price-asc": "Price: Low to High",
  "price-desc": "Price: High to Low",
  bestsellers: "Bestsellers",
};

const PRICE_BANDS: { key: string; label: string }[] = [
  { key: "under-2000", label: "Under KSh 2,000" },
  { key: "under-5000", label: "Under KSh 5,000" },
  { key: "over-5000", label: "Over KSh 5,000" },
];

/**
 * Every control here updates the URL rather than filtering in the browser — the
 * Server Component at app/shop/page.tsx re-queries Supabase on each change and passes
 * fresh `products` down. This component only renders what it's given.
 */
export function ShopClient({
  products,
  categories,
  materialFinishes,
  filters,
  hasActiveDeal,
}: {
  products: Product[];
  categories: Category[];
  materialFinishes: { slug: string; name: string }[];
  filters: ShopFilters;
  hasActiveDeal: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [query, setQuery] = useState(filters.query);

  function updateParams(patch: Record<string, string | null>) {
    const params = new URLSearchParams();
    if (filters.category !== "all") params.set("category", filters.category);
    if (filters.kind !== "all") params.set("kind", filters.kind);
    if (filters.price !== "all") params.set("price", filters.price);
    if (filters.finishes.length) params.set("finish", filters.finishes.join(","));
    if (filters.men) params.set("men", "1");
    if (filters.dealOnly) params.set("deal", "true");
    if (filters.inStockOnly) params.set("stock", "1");
    if (filters.query) params.set("q", filters.query);
    if (filters.sort !== "featured") params.set("sort", filters.sort);

    Object.entries(patch).forEach(([key, value]) => {
      if (value === null) params.delete(key);
      else params.set(key, value);
    });

    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function toggleFinish(slug: string) {
    const next = filters.finishes.includes(slug) ? filters.finishes.filter((f) => f !== slug) : [...filters.finishes, slug];
    updateParams({ finish: next.length ? next.join(",") : null });
  }

  // Debounce search text before pushing to the URL, so we don't refetch on every keystroke.
  useEffect(() => {
    if (query === filters.query) return;
    const timer = setTimeout(() => updateParams({ q: query || null }), 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  return (
    <div>
      <div className="no-scrollbar mb-6 flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => updateParams({ category: null })}
          className={`shrink-0 border px-4 py-2 text-xs uppercase tracking-widest transition-colors ${
            filters.category === "all" ? "border-aurum-obsidian bg-aurum-obsidian text-aurum-ivory" : "border-aurum-obsidian/20"
          }`}
        >
          All
        </button>
        {categories.map((c) => (
          <button
            key={c.slug}
            onClick={() => updateParams({ category: c.slug })}
            className={`shrink-0 border px-4 py-2 text-xs uppercase tracking-widest transition-colors ${
              filters.category === c.slug ? "border-aurum-obsidian bg-aurum-obsidian text-aurum-ivory" : "border-aurum-obsidian/20"
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-y border-[var(--border-subtle)] py-4">
        <div className="flex items-center gap-2 text-sm">
          <Search size={16} strokeWidth={1.5} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pieces…"
            aria-label="Search products"
            className="w-40 bg-transparent placeholder:text-aurum-obsidian/40 focus-visible:outline-none sm:w-56"
          />
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setFiltersOpen((v) => !v)}
            aria-expanded={filtersOpen}
            className="flex items-center gap-2 text-xs uppercase tracking-widest"
          >
            <SlidersHorizontal size={15} strokeWidth={1.5} />
            Filter
          </button>

          <label className="flex items-center gap-2 text-xs uppercase tracking-widest">
            Sort
            <select
              value={filters.sort}
              onChange={(e) => updateParams({ sort: e.target.value === "featured" ? null : e.target.value })}
              className="border-0 bg-transparent text-xs uppercase tracking-widest focus-visible:outline-none"
            >
              {Object.entries(SORT_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {filtersOpen && (
        <div className="mb-10 grid grid-cols-1 gap-8 border-b border-[var(--border-subtle)] pb-8 sm:grid-cols-4">
          <div>
            <p className="mb-3 text-xs uppercase tracking-widest text-aurum-obsidian/50">Type</p>
            <div className="flex flex-wrap gap-2">
              {(["all", "piece", "set"] as const).map((k) => (
                <button
                  key={k}
                  onClick={() => updateParams({ kind: k === "all" ? null : k })}
                  className={`border px-3 py-1.5 text-xs ${filters.kind === k ? "border-aurum-obsidian" : "border-aurum-obsidian/20"}`}
                >
                  {k === "all" ? "All" : k === "piece" ? "Individual Piece" : "Set"}
                </button>
              ))}
            </div>
            <label className="mt-4 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={filters.inStockOnly}
                onChange={(e) => updateParams({ stock: e.target.checked ? "1" : null })}
              />
              In stock only
            </label>
          </div>

          <div>
            <p className="mb-3 text-xs uppercase tracking-widest text-aurum-obsidian/50">Price</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => updateParams({ price: null })}
                className={`border px-3 py-1.5 text-xs ${filters.price === "all" ? "border-aurum-obsidian" : "border-aurum-obsidian/20"}`}
              >
                All
              </button>
              {PRICE_BANDS.map((b) => (
                <button
                  key={b.key}
                  onClick={() => updateParams({ price: b.key })}
                  className={`border px-3 py-1.5 text-xs ${filters.price === b.key ? "border-aurum-obsidian" : "border-aurum-obsidian/20"}`}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-3 text-xs uppercase tracking-widest text-aurum-obsidian/50">Material</p>
            <div className="flex flex-wrap gap-2">
              {materialFinishes.map((f) => (
                <button
                  key={f.slug}
                  onClick={() => toggleFinish(f.slug)}
                  className={`border px-3 py-1.5 text-xs ${filters.finishes.includes(f.slug) ? "border-aurum-obsidian" : "border-aurum-obsidian/20"}`}
                >
                  {f.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-3 text-xs uppercase tracking-widest text-aurum-obsidian/50">Audience</p>
            <button
              onClick={() => updateParams({ men: filters.men ? null : "1" })}
              className={`border px-3 py-1.5 text-xs ${filters.men ? "border-aurum-obsidian" : "border-aurum-obsidian/20"}`}
            >
              For Men
            </button>
            {hasActiveDeal && (
              <button
                onClick={() => updateParams({ deal: filters.dealOnly ? null : "true" })}
                className={`ml-2 border px-3 py-1.5 text-xs ${filters.dealOnly ? "border-aurum-obsidian" : "border-aurum-obsidian/20"}`}
              >
                Deals
              </button>
            )}
          </div>
        </div>
      )}

      {products.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-24 text-center">
          <X size={24} strokeWidth={1} />
          <p className="text-sm text-aurum-obsidian/60">No pieces match those filters just yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-5 gap-y-12 sm:gap-x-8 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
