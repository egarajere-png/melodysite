"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import type { Product, ProductVariant, CategorySlug } from "@/lib/types";
import { categories } from "@/data/categories";
import { collections } from "@/data/collections";
import { getCostPrice } from "@/data/products";

const inputClasses = "w-full border border-aurum-obsidian/15 bg-white px-3 py-2.5 text-sm focus-visible:border-aurum-obsidian focus-visible:outline-none";
const labelClasses = "mb-1.5 block text-xs uppercase tracking-widest text-aurum-obsidian/50";

let variantIdCounter = 0;

function emptyVariant(): ProductVariant {
  variantIdCounter += 1;
  return { id: `new-variant-${variantIdCounter}`, sku: "", colour: "", size: "", stock: 0 };
}

export function ProductForm({ product }: { product?: Product }) {
  const router = useRouter();
  const isNew = !product;

  const [name, setName] = useState(product?.name ?? "");
  const [category, setCategory] = useState<CategorySlug>(product?.category ?? "rings");
  const [collectionSlugs, setCollectionSlugs] = useState<string[]>(product?.collections ?? []);
  const [description, setDescription] = useState(product?.description ?? "");
  const [price, setPrice] = useState(product?.price ?? 0);
  const [salePrice, setSalePrice] = useState<number | "">(product?.salePrice ?? "");
  const [costPrice, setCostPrice] = useState(product ? getCostPrice(product) : 0);
  const [variants, setVariants] = useState<ProductVariant[]>(product?.variants ?? [emptyVariant()]);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  function updateVariant(id: string, patch: Partial<ProductVariant>) {
    setVariants((prev) => prev.map((v) => (v.id === id ? { ...v, ...patch } : v)));
  }

  function toggleCollection(slug: string) {
    setCollectionSlugs((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // No backend is connected yet — this demonstrates the full editing UX without persisting.
    setSavedMessage(
      isNew ? "Product created (demo only — connect a backend to persist)." : "Changes saved (demo only — connect a backend to persist)."
    );
    window.setTimeout(() => setSavedMessage(null), 4000);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      <div className="grid gap-6 border border-aurum-obsidian/10 bg-white p-6 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={labelClasses}>Product Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required className={inputClasses} />
        </div>

        <div>
          <label className={labelClasses}>Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value as CategorySlug)} className={inputClasses}>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClasses}>Collections</label>
          <div className="flex flex-wrap gap-2 pt-1">
            {collections.map((c) => (
              <button
                type="button"
                key={c.slug}
                onClick={() => toggleCollection(c.slug)}
                className={`border px-3 py-1.5 text-xs ${
                  collectionSlugs.includes(c.slug) ? "border-aurum-obsidian bg-aurum-obsidian text-aurum-ivory" : "border-aurum-obsidian/20"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        <div className="sm:col-span-2">
          <label className={labelClasses}>Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} required className={inputClasses} />
        </div>

        <div>
          <label className={labelClasses}>Price (KES)</label>
          <input type="number" min={0} value={price} onChange={(e) => setPrice(Number(e.target.value))} required className={inputClasses} />
        </div>
        <div>
          <label className={labelClasses}>Sale Price (KES, optional)</label>
          <input
            type="number"
            min={0}
            value={salePrice}
            onChange={(e) => setSalePrice(e.target.value === "" ? "" : Number(e.target.value))}
            className={inputClasses}
          />
        </div>
        <div>
          <label className={labelClasses}>Cost Price (KES)</label>
          <input type="number" min={0} value={costPrice} onChange={(e) => setCostPrice(Number(e.target.value))} className={inputClasses} />
          <p className="mt-1 text-xs text-aurum-obsidian/40">Used to calculate profit — not shown to customers.</p>
        </div>
      </div>

      <div className="border border-aurum-obsidian/10 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl">Variants & Stock</h2>
          <button
            type="button"
            onClick={() => setVariants((prev) => [...prev, emptyVariant()])}
            className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-aurum-deep"
          >
            <Plus size={14} strokeWidth={1.5} />
            Add Variant
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-widest text-aurum-obsidian/50">
                <th className="pb-2 pr-3">SKU</th>
                <th className="pb-2 pr-3">Colour</th>
                <th className="pb-2 pr-3">Size</th>
                <th className="pb-2 pr-3">Stock</th>
                <th className="pb-2" />
              </tr>
            </thead>
            <tbody>
              {variants.map((v) => (
                <tr key={v.id} className="border-t border-aurum-obsidian/5">
                  <td className="py-2 pr-3">
                    <input
                      value={v.sku}
                      onChange={(e) => updateVariant(v.id, { sku: e.target.value })}
                      className={inputClasses}
                    />
                  </td>
                  <td className="py-2 pr-3">
                    <input
                      value={v.colour ?? ""}
                      onChange={(e) => updateVariant(v.id, { colour: e.target.value })}
                      className={inputClasses}
                    />
                  </td>
                  <td className="py-2 pr-3">
                    <input
                      value={v.size ?? ""}
                      onChange={(e) => updateVariant(v.id, { size: e.target.value })}
                      className={inputClasses}
                    />
                  </td>
                  <td className="py-2 pr-3">
                    <input
                      type="number"
                      min={0}
                      value={v.stock}
                      onChange={(e) => updateVariant(v.id, { stock: Number(e.target.value) })}
                      className={`${inputClasses} w-24`}
                    />
                  </td>
                  <td className="py-2">
                    <button
                      type="button"
                      onClick={() => setVariants((prev) => prev.filter((x) => x.id !== v.id))}
                      aria-label="Remove variant"
                      className="text-aurum-obsidian/40 hover:text-red-800"
                    >
                      <Trash2 size={16} strokeWidth={1.5} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button type="submit" className="bg-aurum-deep px-8 py-3 text-xs uppercase tracking-widest text-aurum-ivory transition-colors hover:bg-aurum-plum">
          {isNew ? "Create Product" : "Save Changes"}
        </button>
        <button type="button" onClick={() => router.push("/admin/products")} className="text-xs uppercase tracking-widest text-aurum-obsidian/60">
          Cancel
        </button>
        {savedMessage && <p className="text-sm text-green-800">{savedMessage}</p>}
      </div>
    </form>
  );
}
