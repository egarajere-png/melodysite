"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import type { CategorySlug, Category, CollectionSummary } from "@/lib/types";
import type { ProductKind } from "@/lib/supabase/database.types";
import type { AdminProductDetail, AdminVariantInput } from "@/lib/supabase/products-admin";
import { createProductAction, updateProductAction } from "@/app/actions/admin-products";
import { useToast } from "@/components/admin/Toast";

const inputClasses = "w-full border border-aurum-obsidian/15 bg-white px-3 py-2.5 text-sm focus-visible:border-aurum-obsidian focus-visible:outline-none";
const labelClasses = "mb-1.5 block text-xs uppercase tracking-widest text-aurum-obsidian/50";

let variantIdCounter = 0;
function emptyVariant(): AdminVariantInput {
  variantIdCounter += 1;
  return { sku: "", colour: "", size: "", stock: 0 };
}

export function ProductForm({
  product,
  categories,
  collections,
}: {
  product?: AdminProductDetail;
  categories: Category[];
  collections: CollectionSummary[];
}) {
  const router = useRouter();
  const toast = useToast();
  const isNew = !product;

  const [name, setName] = useState(product?.name ?? "");
  const [category, setCategory] = useState<CategorySlug>(product?.category || categories[0]?.slug || "");
  const [productKind, setProductKind] = useState<ProductKind>(product?.productKind ?? "INDIVIDUAL_PIECE");
  const [collectionSlugs, setCollectionSlugs] = useState<string[]>(product?.collections ?? []);
  const [description, setDescription] = useState(product?.description ?? "");
  const [careInstructions, setCareInstructions] = useState(product?.careInstructions ?? "");
  const [shippingInfo, setShippingInfo] = useState(product?.shippingInfo ?? "");
  const [returnsInfo, setReturnsInfo] = useState(product?.returnsInfo ?? "");
  const [materials, setMaterials] = useState(product?.materials.join(", ") ?? "");
  const [price, setPrice] = useState(product?.price ?? 0);
  const [costPrice, setCostPrice] = useState(product?.costPrice ?? 0);
  const [variants, setVariants] = useState<(AdminVariantInput & { key: string })[]>(
    (product?.variants ?? [emptyVariant()]).map((v, i) => ({ ...v, key: v.id ?? `new-${i}-${variantIdCounter}` }))
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function updateVariant(key: string, patch: Partial<AdminVariantInput>) {
    setVariants((prev) => prev.map((v) => (v.key === key ? { ...v, ...patch } : v)));
  }

  function toggleCollection(slug: string) {
    setCollectionSlugs((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const input = {
      name,
      category,
      productKind,
      collections: collectionSlugs,
      description,
      careInstructions,
      shippingInfo,
      returnsInfo,
      materials: materials.split(",").map((m) => m.trim()).filter(Boolean),
      price,
      costPrice,
      variants: variants.map((v) => ({ id: v.id, sku: v.sku, colour: v.colour, size: v.size, stock: v.stock })),
    };

    const result = isNew ? await createProductAction(input) : await updateProductAction(product.id, input);
    setSaving(false);
    if (result.ok) {
      if (isNew) {
        toast.success(`${name} has been added. Now upload its images.`);
        router.push(`/admin/products/${result.id}`);
      } else {
        toast.success(`${name} has been updated.`);
        // Stay on the page: new colours need a fresh server render to get an image gallery.
        router.refresh();
      }
    } else {
      setMessage(result.error);
      toast.error(result.error);
    }
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
          <label className={labelClasses}>Product Type</label>
          <div className="flex gap-2 pt-1">
            {(["INDIVIDUAL_PIECE", "SET"] as const).map((k) => (
              <button
                type="button"
                key={k}
                onClick={() => setProductKind(k)}
                className={`border px-3 py-1.5 text-xs ${productKind === k ? "border-aurum-obsidian bg-aurum-obsidian text-aurum-ivory" : "border-aurum-obsidian/20"}`}
              >
                {k === "SET" ? "Set" : "Individual Piece"}
              </button>
            ))}
          </div>
        </div>

        <div className="sm:col-span-2">
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

        <div className="sm:col-span-2">
          <label className={labelClasses}>Materials (comma-separated)</label>
          <input value={materials} onChange={(e) => setMaterials(e.target.value)} placeholder="e.g. Sterling silver, Gold vermeil option" className={inputClasses} />
        </div>

        <div>
          <label className={labelClasses}>Care Instructions</label>
          <textarea value={careInstructions} onChange={(e) => setCareInstructions(e.target.value)} rows={2} className={inputClasses} />
        </div>
        <div>
          <label className={labelClasses}>Shipping Info</label>
          <textarea value={shippingInfo} onChange={(e) => setShippingInfo(e.target.value)} rows={2} className={inputClasses} />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClasses}>Returns Info</label>
          <textarea value={returnsInfo} onChange={(e) => setReturnsInfo(e.target.value)} rows={2} className={inputClasses} />
        </div>

        <div>
          <label className={labelClasses}>Price (KES)</label>
          <input type="number" min={0} value={price} onChange={(e) => setPrice(Number(e.target.value))} required className={inputClasses} />
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
            onClick={() => setVariants((prev) => [...prev, { ...emptyVariant(), key: `new-${prev.length}-${variantIdCounter}` }])}
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
                <tr key={v.key} className="border-t border-aurum-obsidian/5">
                  <td className="py-2 pr-3">
                    <input value={v.sku} onChange={(e) => updateVariant(v.key, { sku: e.target.value })} required className={inputClasses} />
                  </td>
                  <td className="py-2 pr-3">
                    <input value={v.colour ?? ""} onChange={(e) => updateVariant(v.key, { colour: e.target.value })} className={inputClasses} />
                  </td>
                  <td className="py-2 pr-3">
                    <input value={v.size ?? ""} onChange={(e) => updateVariant(v.key, { size: e.target.value })} className={inputClasses} />
                  </td>
                  <td className="py-2 pr-3">
                    <input
                      type="number"
                      min={0}
                      value={v.stock}
                      onChange={(e) => updateVariant(v.key, { stock: Number(e.target.value) })}
                      className={`${inputClasses} w-24`}
                    />
                  </td>
                  <td className="py-2">
                    <button
                      type="button"
                      onClick={() => setVariants((prev) => prev.filter((x) => x.key !== v.key))}
                      aria-label="Remove variant"
                      className="text-aurum-obsidian/40 hover:text-aurum-earth"
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
        <button
          type="submit"
          disabled={saving}
          className="bg-aurum-deep px-8 py-3 text-xs uppercase tracking-widest text-aurum-ivory transition-colors hover:bg-aurum-plum disabled:opacity-60"
        >
          {saving ? "Saving…" : isNew ? "Create Product" : "Save Changes"}
        </button>
        <button type="button" onClick={() => router.push("/admin/products")} className="text-xs uppercase tracking-widest text-aurum-obsidian/60">
          Cancel
        </button>
        {message && <p className="text-sm text-aurum-earth">{message}</p>}
      </div>
    </form>
  );
}
