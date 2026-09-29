"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { createCollectionAction, deleteCollectionAction, updateCollectionAction, type AdminCollectionActionResult } from "@/app/actions/admin-collections";
import type { AdminCollection, CollectionInput } from "@/lib/supabase/collections-admin";
import { useToast } from "@/components/admin/Toast";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { ProductPicker, type PickableProduct } from "@/components/admin/ProductPicker";

const inputClasses = "w-full border border-aurum-obsidian/15 bg-white px-3 py-2.5 text-sm focus-visible:border-aurum-obsidian focus-visible:outline-none";
const labelClasses = "mb-1.5 block text-xs uppercase tracking-widest text-aurum-obsidian/50";

const EMPTY: CollectionInput = { name: "", description: "", isActive: true, productIds: [] };

export function AdminCollectionsClient({ collections: initial, products }: { collections: AdminCollection[]; products: PickableProduct[] }) {
  const toast = useToast();
  const [collections, setCollections] = useState(initial);
  // null = editor closed, "new" = creating, otherwise the id being edited.
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<CollectionInput>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<AdminCollection | null>(null);
  const [deleting, setDeleting] = useState(false);

  const productName = new Map(products.map((p) => [p.id, p.name]));

  function openNew() {
    setEditing("new");
    setForm(EMPTY);
  }

  function openEdit(c: AdminCollection) {
    setEditing(c.id);
    setForm({ name: c.name, description: c.description ?? "", isActive: c.isActive, productIds: c.productIds });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function apply(result: AdminCollectionActionResult, success: string) {
    if (!result.ok) {
      toast.error(result.error);
      return false;
    }
    setCollections(result.collections);
    toast.success(success);
    return true;
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const isNew = editing === "new";
    const result = isNew ? await createCollectionAction(form) : await updateCollectionAction(editing!, form);
    if (apply(result, isNew ? `${form.name.trim()} collection has been created.` : `${form.name.trim()} collection has been updated.`)) setEditing(null);
    setSaving(false);
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    apply(await deleteCollectionAction(pendingDelete.id, pendingDelete.name), `${pendingDelete.name} collection has been deleted.`);
    if (editing === pendingDelete.id) setEditing(null);
    setDeleting(false);
    setPendingDelete(null);
  }

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">Collections</h1>
          <p className="mt-1 text-sm text-aurum-obsidian/50">Curated groups of products. A product can be in several collections.</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 bg-aurum-deep px-5 py-3 text-xs uppercase tracking-widest text-aurum-ivory transition-colors hover:bg-aurum-plum"
        >
          <Plus size={15} strokeWidth={1.5} />
          New Collection
        </button>
      </div>

      {editing && (
        <form onSubmit={handleSave} className="mb-8 flex flex-col gap-5 border border-aurum-obsidian/10 bg-white p-6">
          <h2 className="font-display text-xl">{editing === "new" ? "New collection" : `Edit ${collections.find((c) => c.id === editing)?.name ?? "collection"}`}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClasses}>Name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className={inputClasses} />
            </div>
            <div>
              <label className={labelClasses}>Description (optional)</label>
              <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputClasses} />
            </div>
          </div>
          <label className="flex w-fit cursor-pointer items-center gap-2 text-sm">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="accent-aurum-deep" />
            Visible in the shop
          </label>
          <ProductPicker products={products} selected={form.productIds} onChange={(productIds) => setForm({ ...form, productIds })} />
          <div className="flex items-center gap-4">
            <button type="submit" disabled={saving} className="bg-aurum-deep px-6 py-2.5 text-xs uppercase tracking-widest text-aurum-ivory transition-colors hover:bg-aurum-plum disabled:opacity-60">
              {saving ? "Saving…" : editing === "new" ? "Create Collection" : "Save Changes"}
            </button>
            <button type="button" onClick={() => setEditing(null)} className="text-xs uppercase tracking-widest text-aurum-obsidian/60">
              Cancel
            </button>
          </div>
        </form>
      )}

      {collections.length === 0 ? (
        <p className="text-sm text-aurum-obsidian/50">No collections yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((c) => (
            <div key={c.id} className={`flex flex-col border bg-white p-5 ${editing === c.id ? "border-aurum-obsidian" : "border-aurum-obsidian/10"}`}>
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-display text-lg">{c.name}</h2>
                <span className={`shrink-0 px-2 py-1 text-[10px] uppercase tracking-wide ${c.isActive ? "bg-green-700/10 text-green-800" : "bg-aurum-obsidian/10 text-aurum-obsidian/60"}`}>
                  {c.isActive ? "Visible" : "Hidden"}
                </span>
              </div>
              {c.description && <p className="mt-1 text-sm text-aurum-obsidian/60">{c.description}</p>}
              <p className="mt-3 text-xs uppercase tracking-widest text-aurum-obsidian/40">
                {c.productIds.length} product{c.productIds.length === 1 ? "" : "s"}
              </p>
              {c.productIds.length > 0 && (
                <p className="mt-1 line-clamp-2 text-xs text-aurum-obsidian/50">{c.productIds.map((id) => productName.get(id)).filter(Boolean).join(", ")}</p>
              )}
              <div className="mt-auto flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => openEdit(c)}
                  className="flex items-center gap-1.5 border border-aurum-obsidian/15 px-3 py-1.5 text-xs uppercase tracking-widest transition-colors hover:border-aurum-obsidian hover:bg-aurum-obsidian hover:text-aurum-ivory"
                >
                  <Pencil size={13} strokeWidth={1.5} />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => setPendingDelete(c)}
                  className="flex items-center gap-1.5 border border-aurum-earth/30 px-3 py-1.5 text-xs uppercase tracking-widest text-aurum-earth transition-colors hover:bg-aurum-earth hover:text-aurum-ivory"
                >
                  <Trash2 size={13} strokeWidth={1.5} />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete collection?"
        message={pendingDelete ? `${pendingDelete.name} will be removed from the shop. Its ${pendingDelete.productIds.length} product${pendingDelete.productIds.length === 1 ? "" : "s"} stay in the catalogue — they just won't be grouped under it any more.` : ""}
        confirmLabel="Delete"
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
