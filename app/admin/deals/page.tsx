"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { deals as initialDeals } from "@/data/deals";
import { products } from "@/data/products";
import { formatDate } from "@/lib/format";
import type { Deal } from "@/lib/types";

export default function AdminDealsPage() {
  const [deals, setDeals] = useState<Deal[]>(initialDeals);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [discount, setDiscount] = useState(15);
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  function toggleProduct(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !startsAt || !endsAt || selected.length === 0) return;
    setDeals((prev) => [
      ...prev,
      {
        id: `deal-${Date.now()}`,
        title,
        subtitle,
        productIds: selected,
        discountPercent: discount,
        startsAt,
        endsAt,
        active: true,
      },
    ]);
    setTitle("");
    setSubtitle("");
    setSelected([]);
    setShowForm(false);
  }

  function toggleActive(id: string) {
    setDeals((prev) => prev.map((d) => (d.id === id ? { ...d, active: !d.active } : d)));
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
            <input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="Subtitle" className="border border-aurum-obsidian/15 px-3 py-2.5 text-sm" />
            <input type="number" min={1} max={90} value={discount} onChange={(e) => setDiscount(Number(e.target.value))} placeholder="Discount %" className="border border-aurum-obsidian/15 px-3 py-2.5 text-sm" />
            <div className="grid grid-cols-2 gap-4">
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
        </form>
      )}

      <div className="flex flex-col gap-4">
        {deals.map((deal) => (
          <div key={deal.id} className="flex flex-wrap items-center justify-between gap-4 border border-aurum-obsidian/10 bg-white p-5">
            <div>
              <h2 className="font-display text-lg">{deal.title}</h2>
              <p className="text-sm text-aurum-obsidian/60">{deal.subtitle}</p>
              <p className="mt-1 text-xs text-aurum-obsidian/40">
                {deal.discountPercent}% off · {deal.productIds.length} products · {formatDate(deal.startsAt)} – {formatDate(deal.endsAt)}
              </p>
            </div>
            <button
              onClick={() => toggleActive(deal.id)}
              className={`px-4 py-2 text-xs uppercase tracking-widest ${
                deal.active ? "bg-green-700/10 text-green-800" : "bg-aurum-obsidian/10 text-aurum-obsidian/60"
              }`}
            >
              {deal.active ? "Active" : "Inactive"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
