"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { formatKES } from "@/lib/format";
import { deleteProductAction } from "@/app/actions/admin-products";
import { useToast } from "@/components/admin/Toast";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import type { AdminProductListItem } from "@/lib/supabase/products-admin";

export function AdminProductsTable({ products: initial }: { products: AdminProductListItem[] }) {
  const toast = useToast();
  const [products, setProducts] = useState(initial);
  const [query, setQuery] = useState("");
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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => p.name.toLowerCase().includes(q) || p.categoryName.toLowerCase().includes(q));
  }, [query, products]);

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
                  No products match that search.
                </td>
              </tr>
            ) : (
              filtered.map((p) => (
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
