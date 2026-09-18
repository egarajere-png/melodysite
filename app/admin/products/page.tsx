"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { products, totalStock } from "@/data/products";
import { formatKES } from "@/lib/format";
import { EditorialImage } from "@/components/ui/EditorialImage";

export default function AdminProductsPage() {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => p.name.toLowerCase().includes(q) || p.category.includes(q));
  }, [query]);

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl">Products</h1>
        <Link
          href="/admin/products/new"
          className="flex items-center gap-2 bg-aurum-deep px-5 py-3 text-xs uppercase tracking-widest text-aurum-ivory transition-colors hover:bg-aurum-plum"
        >
          <Plus size={15} strokeWidth={1.5} />
          New Product
        </Link>
      </div>

      <div className="mb-6 flex items-center gap-2 border border-aurum-obsidian/15 bg-white px-4 py-3 text-sm sm:max-w-sm">
        <Search size={16} strokeWidth={1.5} className="text-aurum-obsidian/40" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products…"
          className="w-full bg-transparent focus-visible:outline-none"
        />
      </div>

      <div className="overflow-x-auto border border-aurum-obsidian/10 bg-white">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-aurum-obsidian/10 text-xs uppercase tracking-widest text-aurum-obsidian/50">
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => {
              const stock = totalStock(p);
              return (
                <tr key={p.id} className="border-b border-aurum-obsidian/5 last:border-0 hover:bg-aurum-ivory/60">
                  <td className="px-4 py-3">
                    <Link href={`/admin/products/${p.id}`} className="flex items-center gap-3">
                      <EditorialImage image={p.images[0]} className="h-12 w-10 shrink-0" />
                      <span>{p.name}</span>
                    </Link>
                  </td>
                  <td className="px-4 py-3 capitalize text-aurum-obsidian/70">{p.category.replace("-", " ")}</td>
                  <td className="px-4 py-3">
                    {p.salePrice ? (
                      <span>
                        <span className="text-aurum-obsidian/40 line-through">{formatKES(p.price)}</span>{" "}
                        {formatKES(p.salePrice)}
                      </span>
                    ) : (
                      formatKES(p.price)
                    )}
                  </td>
                  <td className="px-4 py-3">{stock}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 text-xs uppercase tracking-wide ${
                        stock === 0
                          ? "bg-red-700/10 text-red-800"
                          : stock <= 5
                            ? "bg-aurum-earth/10 text-aurum-earth"
                            : "bg-green-700/10 text-green-800"
                      }`}
                    >
                      {stock === 0 ? "Out of stock" : stock <= 5 ? "Low stock" : "In stock"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
