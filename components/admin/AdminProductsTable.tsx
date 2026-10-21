"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { formatKES } from "@/lib/format";
import { deleteProductAction } from "@/app/actions/admin-products";
import { useToast } from "@/components/admin/Toast";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import type { AdminProductListItem } from "@/lib/supabase/products-admin";
import { Pagination, pageOf } from "@/components/admin/Pagination";

type StockFilter = "all" | "in" | "low" | "out" | "archived";

const STOCK_FILTERS: { value: StockFilter; label: string }[] = [
  { value: "all", label: "Any stock" },
  { value: "in", label: "In stock (6+)" },
  { value: "low", label: "Low stock (1–5)" },
  { value: "out", label: "Out of stock" },
  { value: "archived", label: "Archived" },
];

/** The same buckets as the status badge in each row. */
function stockBucket(p: AdminProductListItem): StockFilter {
  if (!p.isActive) return "archived";
  if (p.totalStock === 0) return "out";
  return p.totalStock <= 5 ? "low" : "in";
}

const control = "border border-aurum-obsidian/15 bg-white px-3 py-2.5 text-sm";

export function AdminProductsTable({ products: initial }: { products: AdminProductListItem[] }) {
  const toast = useToast();
  const [products, setProducts] = useState(initial);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [stock, setStock] = useState<StockFilter>("all");
  const [page, setPage] = useState(1);
  const [pendingDelete, setPendingDelete] = useState<AdminProductListItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function confirmDelete() {
    if (!pendingDelete) return;
    const target = pendingDelete;
    setDeleting(true);
    const result = await deleteProductAction(target.id, target.name);
    setDeleting(false);
    setPendingDelete(null);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    if (result.outcome === "deleted") {
      setProducts((prev) => prev.filter((p) => p.id !== target.id));
      toast.success(`${target.name} has been deleted.`);
    } else {
      setProducts((prev) => prev.map((p) => (p.id === target.id ? { ...p, isActive: false } : p)));
      toast.success(`${target.name} is referenced by stock history, so it has been archived and hidden from the shop instead.`);
    }
  }

  const categories = useMemo(() => [...new Set(products.map((p) => p.categoryName))].sort(), [products]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter(
      (p) =>
        (category === "all" || p.categoryName === category) &&
        (stock === "all" || stockBucket(p) === stock) &&
        (!q || p.name.toLowerCase().includes(q) || p.categoryName.toLowerCase().includes(q) || p.skus.some((sku) => sku.toLowerCase().includes(q)))
    );
  }, [query, category, stock, products]);
  const shown = pageOf(filtered, page);
  const filtering = Boolean(query.trim()) || category !== "all" || stock !== "all";

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

      {/* Changing any filter goes back to the first page. */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2 border border-aurum-obsidian/15 bg-white px-4 py-2.5 text-sm sm:max-w-sm">
          <Search size={16} strokeWidth={1.5} className="shrink-0 text-aurum-obsidian/40" />
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
            placeholder="Search name, category or SKU…"
            aria-label="Search products"
            className="w-full bg-transparent focus-visible:outline-none"
          />
        </div>
        <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} aria-label="Category" className={control}>
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select value={stock} onChange={(e) => { setStock(e.target.value as StockFilter); setPage(1); }} aria-label="Stock" className={control}>
          {STOCK_FILTERS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
        {filtering && (
          <button
            type="button"
            onClick={() => { setQuery(""); setCategory("all"); setStock("all"); setPage(1); }}
            className="text-xs uppercase tracking-widest text-aurum-obsidian/60 underline-offset-4 hover:underline"
          >
            Clear
          </button>
        )}
      </div>

      <div className="overflow-x-auto border border-aurum-obsidian/10 bg-white">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead>
            <tr className="border-b border-aurum-obsidian/10 text-xs uppercase tracking-widest text-aurum-obsidian/50">
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-aurum-obsidian/50">
                  {filtering ? "No products match those filters." : "No products yet."}
                </td>
              </tr>
            ) : (
              shown.rows.map((p) => (
                <tr key={p.id} className="border-b border-aurum-obsidian/5 last:border-0 hover:bg-aurum-ivory/60">
                  <td className="px-4 py-3">
                    <Link href={`/admin/products/${p.id}`} className="font-medium hover:underline">
                      {p.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 capitalize text-aurum-obsidian/70">{p.categoryName}</td>
                  <td className="px-4 py-3">{formatKES(p.price)}</td>
                  <td className="px-4 py-3">{p.totalStock}</td>
                  <td className="px-4 py-3">
                    {!p.isActive ? (
                      <span className="bg-aurum-obsidian/10 px-2 py-1 text-xs uppercase tracking-wide text-aurum-obsidian/60">Archived</span>
                    ) : (
                    <span
                      className={`px-2 py-1 text-xs uppercase tracking-wide ${
                        p.totalStock === 0
                          ? "bg-aurum-earth/10 text-aurum-earth"
                          : p.totalStock <= 5
                            ? "bg-aurum-gold/10 text-aurum-gold"
                            : "bg-green-700/10 text-green-800"
                      }`}
                    >
                      {p.totalStock === 0 ? "Out of stock" : p.totalStock <= 5 ? "Low stock" : "In stock"}
                    </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/products/${p.id}`}
                        className="flex items-center gap-1.5 border border-aurum-obsidian/15 px-3 py-1.5 text-xs uppercase tracking-widest transition-colors hover:border-aurum-obsidian hover:bg-aurum-obsidian hover:text-aurum-ivory"
                      >
                        <Pencil size={13} strokeWidth={1.5} />
                        Edit
                      </Link>
                      <button
                        type="button"
                        onClick={() => setPendingDelete(p)}
                        className="flex items-center gap-1.5 border border-aurum-earth/30 px-3 py-1.5 text-xs uppercase tracking-widest text-aurum-earth transition-colors hover:bg-aurum-earth hover:text-aurum-ivory"
                      >
                        <Trash2 size={13} strokeWidth={1.5} />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={shown.page} pages={shown.pages} total={filtered.length} noun="products" onChange={setPage} />

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete product?"
        message={
          pendingDelete
            ? `${pendingDelete.name} will be removed from the shop, from any customer bags and wishlists, and its images will be deleted. Past orders keep their record of it. This can't be undone.`
            : ""
        }
        confirmLabel="Delete"
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
