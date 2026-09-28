"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { createCollectionAction, deactivateCollectionAction } from "@/app/actions/admin-collections";
import type { AdminCollection } from "@/lib/supabase/collections-admin";

export function AdminCollectionsClient({ collections: initial }: { collections: AdminCollection[] }) {
  const [collections, setCollections] = useState(initial);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const result = await createCollectionAction(name.trim(), description.trim());
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setCollections((prev) => [...prev, { id: `temp-${Date.now()}`, slug: name.trim().toLowerCase().replace(/\s+/g, "-"), name: name.trim(), description: description || null, productCount: 0 }]);
    setName("");
    setDescription("");
    setShowForm(false);
    setError(null);
  }

  async function handleRemove(id: string) {
    setCollections((prev) => prev.filter((c) => c.id !== id));
    const result = await deactivateCollectionAction(id);
    if (!result.ok) setCollections(initial);
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-display text-3xl">Collections</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 bg-aurum-deep px-5 py-3 text-xs uppercase tracking-widest text-aurum-ivory transition-colors hover:bg-aurum-plum"
        >
          <Plus size={15} strokeWidth={1.5} />
          New Collection
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="mb-8 grid gap-4 border border-aurum-obsidian/10 bg-white p-6 sm:grid-cols-2">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Collection name" required className="border border-aurum-obsidian/15 px-3 py-2.5 text-sm" />
          <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optional)" className="border border-aurum-obsidian/15 px-3 py-2.5 text-sm" />
          <button type="submit" className="bg-aurum-deep px-6 py-2.5 text-xs uppercase tracking-widest text-aurum-ivory sm:col-span-2 sm:w-fit">
            Add Collection
          </button>
          {error && <p className="text-sm text-aurum-earth sm:col-span-2">{error}</p>}
        </form>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {collections.map((c) => (
          <div key={c.id} className="border border-aurum-obsidian/10 bg-white p-5">
            <div className="flex items-start justify-between">
              <h2 className="font-display text-lg">{c.name}</h2>
              <button onClick={() => handleRemove(c.id)} aria-label={`Remove ${c.name}`} className="text-aurum-obsidian/40 hover:text-aurum-earth">
                <Trash2 size={15} strokeWidth={1.5} />
              </button>
            </div>
            {c.description && <p className="mt-1 text-sm text-aurum-obsidian/60">{c.description}</p>}
            <p className="mt-3 text-xs uppercase tracking-widest text-aurum-obsidian/40">{c.productCount} products</p>
          </div>
        ))}
      </div>
    </div>
  );
}
