"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SlidersHorizontal, Search, X } from "lucide-react";
import { categories } from "@/data/categories";
import { products, effectivePrice } from "@/data/products";
import { getActiveDeal } from "@/data/deals";
import { ProductCard } from "@/components/product/ProductCard";
import type { CategorySlug } from "@/lib/types";

type SortKey = "featured" | "newest" | "price-asc" | "price-desc" | "bestsellers";

const SORT_LABELS: Record<SortKey, string> = {
  featured: "Featured",
  newest: "Newest",
  "price-asc": "Price: Low to High",
  "price-desc": "Price: High to Low",
  bestsellers: "Bestsellers",
};

export function ShopClient() {
  const searchParams = useSearchParams();
  const deal = getActiveDeal();

  const [category, setCategory] = useState<CategorySlug | "all">(
    (searchParams.get("category") as CategorySlug) || "all"
  );
  const [sort, setSort] = useState<SortKey>(
    searchParams.get("sort") === "new"
      ? "newest"
      : searchParams.get("sort") === "bestsellers"
        ? "bestsellers"
        : "featured"
  );
  const [dealOnly] = useState(searchParams.get("deal") === "true");
  const [query, setQuery] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [maxPrice, setMaxPrice] = useState(15000);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [colour, setColour] = useState<string | "all">("all");
  const [size, setSize] = useState<string | "all">("all");

  const allColours = useMemo(
    () => Array.from(new Set(products.flatMap((p) => p.variants.map((v) => v.colour).filter(Boolean)))) as string[],
    []
  );
  const allSizes = useMemo(
    () => Array.from(new Set(products.flatMap((p) => p.variants.map((v) => v.size).filter(Boolean)))) as string[],
    []
  );

  const filtered = useMemo(() => {
    let list = [...products];

    if (dealOnly && deal) list = list.filter((p) => deal.productIds.includes(p.id));
    if (category !== "all") list = list.filter((p) => p.category === category);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
    }
    list = list.filter((p) => effectivePrice(p) <= maxPrice);
    if (inStockOnly) list = list.filter((p) => p.variants.some((v) => v.stock > 0));
    if (colour !== "all") list = list.filter((p) => p.variants.some((v) => v.colour === colour));
    if (size !== "all") list = list.filter((p) => p.variants.some((v) => v.size === size));

    switch (sort) {
      case "newest":
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case "price-asc":
        list.sort((a, b) => effectivePrice(a) - effectivePrice(b));
        break;
      case "price-desc":
        list.sort((a, b) => effectivePrice(b) - effectivePrice(a));
        break;
      case "bestsellers":
        list.sort((a, b) => Number(b.isBestseller) - Number(a.isBestseller));
        break;
      default:
        break;
    }

    return list;
  }, [category, query, maxPrice, inStockOnly, colour, size, sort, dealOnly, deal]);

  return (
    <div>
      <div className="no-scrollbar mb-6 flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setCategory("all")}
          className={`shrink-0 border px-4 py-2 text-xs uppercase tracking-widest transition-colors ${
            category === "all" ? "border-aurum-obsidian bg-aurum-obsidian text-aurum-ivory" : "border-aurum-obsidian/20"
          }`}
        >
          All
        </button>
        {categories.map((c) => (
          <button
            key={c.slug}
            onClick={() => setCategory(c.slug)}
            className={`shrink-0 border px-4 py-2 text-xs uppercase tracking-widest transition-colors ${
              category === c.slug ? "border-aurum-obsidian bg-aurum-obsidian text-aurum-ivory" : "border-aurum-obsidian/20"
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
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
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
        <div className="mb-10 grid grid-cols-1 gap-8 border-b border-[var(--border-subtle)] pb-8 sm:grid-cols-3">
          <div>
            <p className="mb-3 text-xs uppercase tracking-widest text-aurum-obsidian/50">
              Max Price: KES {maxPrice.toLocaleString()}
            </p>
            <input
              type="range"
              min={1500}
              max={15000}
              step={500}
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-aurum-deep"
            />
            <label className="mt-4 flex items-center gap-2 text-sm">
              <input type="checkbox" checked={inStockOnly} onChange={(e) => setInStockOnly(e.target.checked)} />
              In stock only
            </label>
          </div>

          <div>
            <p className="mb-3 text-xs uppercase tracking-widest text-aurum-obsidian/50">Colour</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setColour("all")}
                className={`border px-3 py-1.5 text-xs ${colour === "all" ? "border-aurum-obsidian" : "border-aurum-obsidian/20"}`}
              >
                All
              </button>
              {allColours.map((c) => (
                <button
                  key={c}
                  onClick={() => setColour(c)}
                  className={`border px-3 py-1.5 text-xs ${colour === c ? "border-aurum-obsidian" : "border-aurum-obsidian/20"}`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-3 text-xs uppercase tracking-widest text-aurum-obsidian/50">Size</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSize("all")}
                className={`border px-3 py-1.5 text-xs ${size === "all" ? "border-aurum-obsidian" : "border-aurum-obsidian/20"}`}
              >
                All
              </button>
              {allSizes.map((s) => (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  className={`border px-3 py-1.5 text-xs ${size === s ? "border-aurum-obsidian" : "border-aurum-obsidian/20"}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-24 text-center">
          <X size={24} strokeWidth={1} />
          <p className="text-sm text-aurum-obsidian/60">No pieces match those filters just yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-5 gap-y-12 sm:gap-x-8 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
