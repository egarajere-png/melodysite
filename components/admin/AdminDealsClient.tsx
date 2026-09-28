"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { createDealAction, setDealActiveAction } from "@/app/actions/admin-deals";
import { formatDate } from "@/lib/format";
import type { AdminDeal } from "@/lib/supabase/deals-admin";

export function AdminDealsClient({ deals: initial, products }: { deals: AdminDeal[]; products: { id: string; name: string }[] }) {
  const [deals, setDeals] = useState(initial);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [discount, setDiscount] = useState(15);
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  function toggleProduct(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !startsAt || !endsAt || selected.length === 0) return;
    const result = await createDealAction({ title, discountPercent: discount, startsAt, endsAt, productIds: selected });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setDeals((prev) => [
      { id: `temp-${Date.now()}`, title, discountPercent: discount, startsAt, endsAt, isActive: true, productCount: selected.length },
      ...prev,
    ]);
    setTitle("");
    setSelected([]);
    setShowForm(false);
    setError(null);
  }

  async function toggleActive(id: string, current: boolean) {
    setDeals((prev) => prev.map((d) => (d.id === id ? { ...d, isActive: !current } : d)));
    const result = await setDealActiveAction(id, !current);
    if (!result.ok) setDeals(initial);
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-display text-3xl">Deals</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 bg-aurum-deep px-5 py-3 text-xs uppercase tracking-widest text-aurum-ivory transition-colors hover:bg-aurum-plum"
        >
          <Plus size={15} strokeWidth={1.5} />
          New Deal
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="mb-8 flex flex-col gap-4 border border-aurum-obsidian/10 bg-white p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Deal title" required className="border border-aurum-obsidian/15 px-3 py-2.5 text-sm" />
            <input type="number" min={1} max={90} value={discount} onChange={(e) => setDiscount(Number(e.target.value))} placeholder="Discount %" className="border border-aurum-obsidian/15 px-3 py-2.5 text-sm" />
            <div className="grid grid-cols-2 gap-4 sm:col-span-2">
              <input type="date" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} required className="border border-aurum-obsidian/15 px-3 py-2.5 text-sm" />
              <input type="date" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} required className="border border-aurum-obsidian/15 px-3 py-2.5 text-sm" />
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs uppercase tracking-widest text-aurum-obsidian/50">Select Products</p>
            <div className="grid max-h-48 grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3">
              {products.map((p) => (
                <label key={p.id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={selected.includes(p.id)} onChange={() => toggleProduct(p.id)} />
                  {p.name}
                </label>
              ))}
            </div>
          </div>

          <button type="submit" className="w-fit bg-aurum-deep px-6 py-2.5 text-xs uppercase tracking-widest text-aurum-ivory">
            Create Deal
          </button>
          {error && <p className="text-sm text-aurum-earth">{error}</p>}
        </form>
      )}

      <div className="flex flex-col gap-4">
        {deals.length === 0 ? (
          <p className="text-sm text-aurum-obsidian/50">No deals yet.</p>
        ) : (
          deals.map((deal) => (
            <div key={deal.id} className="flex flex-wrap items-center justify-between gap-4 border border-aurum-obsidian/10 bg-white p-5">
              <div>
                <h2 className="font-display text-lg">{deal.title}</h2>
                <p className="mt-1 text-xs text-aurum-obsidian/40">
                  {deal.discountPercent}% off · {deal.productCount} products · {formatDate(deal.startsAt)} – {formatDate(deal.endsAt)}
                </p>
              </div>
              <button
                onClick={() => toggleActive(deal.id, deal.isActive)}
                className={`px-4 py-2 text-xs uppercase tracking-widest ${deal.isActive ? "bg-green-700/10 text-green-800" : "bg-aurum-obsidian/10 text-aurum-obsidian/60"}`}
              >
                {deal.isActive ? "Active" : "Inactive"}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
