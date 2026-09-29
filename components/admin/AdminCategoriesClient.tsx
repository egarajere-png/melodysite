"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Check, Eye, EyeOff, Pencil, Plus, Trash2, X } from "lucide-react";
import {
  createCategoryAction,
  deleteCategoryAction,
  moveCategoryAction,
  renameCategoryAction,
  setCategoryVisibleAction,
  type CategoryActionResult,
} from "@/app/actions/admin-categories";
import { useToast } from "@/components/admin/Toast";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import type { AdminCategory } from "@/lib/supabase/categories-admin";

const inputClasses = "w-full border border-aurum-obsidian/15 bg-white px-3 py-2.5 text-sm focus-visible:border-aurum-obsidian focus-visible:outline-none";

export function AdminCategoriesClient({ categories: initial }: { categories: AdminCategory[] }) {
  const toast = useToast();
  const [categories, setCategories] = useState(initial);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<AdminCategory | null>(null);
  const [moveTo, setMoveTo] = useState("");

  function apply(result: CategoryActionResult, success: string): boolean {
    if (!result.ok) {
      toast.error(result.error);
      return false;
    }
    setCategories(result.categories);
    toast.success(success);
    return true;
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    setBusyId("new");
    if (apply(await createCategoryAction(name), `${name} category has been added. It now appears in the Shop menu.`)) setNewName("");
    setBusyId(null);
  }

  async function handleRename(category: AdminCategory) {
    const name = editName.trim();
    if (!name || name === category.name) {
      setEditingId(null);
      return;
    }
    setBusyId(category.id);
    if (apply(await renameCategoryAction(category.id, name), `${category.name} has been renamed to ${name}.`)) setEditingId(null);
    setBusyId(null);
  }

  async function handleVisibility(category: AdminCategory) {
    setBusyId(category.id);
    apply(
      await setCategoryVisibleAction(category.id, !category.isActive),
      category.isActive ? `${category.name} is now hidden from the shop.` : `${category.name} is now visible in the shop.`
    );
    setBusyId(null);
  }

  async function handleMove(category: AdminCategory, direction: "up" | "down") {
    setBusyId(category.id);
    apply(await moveCategoryAction(category.id, direction), `${category.name} has been moved ${direction}.`);
    setBusyId(null);
  }

  function openDelete(category: AdminCategory) {
    setPendingDelete(category);
    setMoveTo(categories.find((c) => c.id !== category.id)?.id ?? "");
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    const target = pendingDelete;
    setBusyId(target.id);
    const result = await deleteCategoryAction(target.id, target.productCount > 0 ? moveTo : undefined);
    const movedTo = categories.find((c) => c.id === moveTo)?.name;
    apply(
      result,
      result.ok && result.moved
        ? `${target.name} has been deleted. ${result.moved} product${result.moved === 1 ? " was" : "s were"} moved to ${movedTo}.`
        : `${target.name} has been deleted.`
    );
    setBusyId(null);
    setPendingDelete(null);
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl">Categories</h1>
        <p className="mt-1 max-w-2xl text-sm text-aurum-obsidian/50">
          Categories appear in the navbar Shop menu, the mobile menu, the homepage &ldquo;Shop by Category&rdquo; tiles and the shop filters, in the order shown here.
        </p>
      </div>

      <form onSubmit={handleCreate} className="mb-8 flex flex-col gap-3 border border-aurum-obsidian/10 bg-white p-5 sm:flex-row">
        <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="New category name, e.g. Necklaces" className={inputClasses} />
        <button
          type="submit"
          disabled={busyId === "new" || !newName.trim()}
          className="flex shrink-0 items-center justify-center gap-2 bg-aurum-deep px-5 py-2.5 text-xs uppercase tracking-widest text-aurum-ivory transition-colors hover:bg-aurum-plum disabled:opacity-50"
        >
          <Plus size={15} strokeWidth={1.5} />
          Add Category
        </button>
      </form>

      <div className="overflow-x-auto border border-aurum-obsidian/10 bg-white">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="border-b border-aurum-obsidian/10 text-xs uppercase tracking-widest text-aurum-obsidian/50">
              <th className="w-20 px-4 py-3">Order</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Tile image</th>
              <th className="px-4 py-3">Products</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-aurum-obsidian/50">
                  No categories yet.
                </td>
              </tr>
            )}
            {categories.map((c, i) => {
              const busy = busyId === c.id;
              return (
                <tr key={c.id} className={`border-b border-aurum-obsidian/5 last:border-0 ${busy ? "opacity-50" : ""}`}>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button type="button" onClick={() => handleMove(c, "up")} disabled={i === 0 || Boolean(busyId)} aria-label={`Move ${c.name} up`} className="p-1 text-aurum-obsidian/50 hover:text-aurum-obsidian disabled:opacity-25">
                        <ArrowUp size={15} strokeWidth={1.5} />
                      </button>
                      <button type="button" onClick={() => handleMove(c, "down")} disabled={i === categories.length - 1 || Boolean(busyId)} aria-label={`Move ${c.name} down`} className="p-1 text-aurum-obsidian/50 hover:text-aurum-obsidian disabled:opacity-25">
                        <ArrowDown size={15} strokeWidth={1.5} />
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {editingId === c.id ? (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleRename(c);
                        }}
                        className="flex items-center gap-2"
                      >
                        <input value={editName} onChange={(e) => setEditName(e.target.value)} autoFocus onKeyDown={(e) => e.key === "Escape" && setEditingId(null)} className={`${inputClasses} py-1.5`} />
                        <button type="submit" aria-label="Save name" className="p-1 text-green-800">
                          <Check size={16} strokeWidth={1.5} />
                        </button>
                        <button type="button" onClick={() => setEditingId(null)} aria-label="Cancel rename" className="p-1 text-aurum-obsidian/50">
                          <X size={16} strokeWidth={1.5} />
                        </button>
                      </form>
                    ) : (
                      <span className="font-medium">{c.name}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-aurum-obsidian/50">images/categories/{c.slug}.jpg</td>
                  <td className="px-4 py-3">{c.productCount}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs uppercase tracking-wide ${c.isActive ? "bg-green-700/10 text-green-800" : "bg-aurum-obsidian/10 text-aurum-obsidian/60"}`}>
                      {c.isActive ? "Visible" : "Hidden"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(c.id);
                          setEditName(c.name);
                        }}
                        disabled={Boolean(busyId)}
                        className="flex items-center gap-1.5 border border-aurum-obsidian/15 px-3 py-1.5 text-xs uppercase tracking-widest transition-colors hover:border-aurum-obsidian hover:bg-aurum-obsidian hover:text-aurum-ivory disabled:opacity-40"
                      >
                        <Pencil size={13} strokeWidth={1.5} />
                        Rename
                      </button>
                      <button
                        type="button"
                        onClick={() => handleVisibility(c)}
                        disabled={Boolean(busyId)}
                        className="flex items-center gap-1.5 border border-aurum-obsidian/15 px-3 py-1.5 text-xs uppercase tracking-widest transition-colors hover:border-aurum-obsidian hover:bg-aurum-obsidian hover:text-aurum-ivory disabled:opacity-40"
                      >
                        {c.isActive ? <EyeOff size={13} strokeWidth={1.5} /> : <Eye size={13} strokeWidth={1.5} />}
                        {c.isActive ? "Hide" : "Show"}
                      </button>
                      <button
                        type="button"
                        onClick={() => openDelete(c)}
                        disabled={Boolean(busyId)}
                        className="flex items-center gap-1.5 border border-aurum-earth/30 px-3 py-1.5 text-xs uppercase tracking-widest text-aurum-earth transition-colors hover:bg-aurum-earth hover:text-aurum-ivory disabled:opacity-40"
                      >
                        <Trash2 size={13} strokeWidth={1.5} />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-aurum-obsidian/40">
        Tile image: put a photo at <span className="font-mono">public/images/categories/&lt;slug&gt;.jpg</span> — categories without one use <span className="font-mono">default.jpg</span>.
      </p>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete category?"
        message={
          pendingDelete
            ? pendingDelete.productCount > 0
              ? `${pendingDelete.name} has ${pendingDelete.productCount} product${pendingDelete.productCount === 1 ? "" : "s"}. They'll be moved to the category you choose below, then ${pendingDelete.name} will be removed from the shop.`
              : `${pendingDelete.name} will be removed from the Shop menu and filters. This can't be undone.`
            : ""
        }
        confirmLabel="Delete"
        busy={busyId === pendingDelete?.id}
        confirmDisabled={Boolean(pendingDelete && pendingDelete.productCount > 0 && !moveTo)}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      >
        {pendingDelete && pendingDelete.productCount > 0 && (
          <label className="block">
            <span className="mb-1.5 block text-xs uppercase tracking-widest text-aurum-obsidian/50">Move products to</span>
            <select value={moveTo} onChange={(e) => setMoveTo(e.target.value)} className={inputClasses}>
              {categories
                .filter((c) => c.id !== pendingDelete.id)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {c.isActive ? "" : " (hidden)"}
                  </option>
                ))}
            </select>
          </label>
        )}
      </ConfirmDialog>
    </div>
  );
}
