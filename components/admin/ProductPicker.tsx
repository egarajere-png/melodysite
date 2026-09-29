"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

export interface PickableProduct {
  id: string;
  name: string;
  isActive?: boolean;
}

/** Searchable checkbox list for choosing which products belong to a collection or deal. */
export function ProductPicker({ products, selected, onChange }: { products: PickableProduct[]; selected: string[]; onChange: (ids: string[]) => void }) {
  const [query, setQuery] = useState("");
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? products.filter((p) => p.name.toLowerCase().includes(q)) : products;
  }, [products, query]);

  function toggle(id: string) {
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-xs uppercase tracking-widest text-aurum-obsidian/50">
          Products <span className="normal-case tracking-normal">({selected.length} selected)</span>
        </p>
        <div className="flex gap-3 text-xs uppercase tracking-widest">
          <button type="button" onClick={() => onChange(Array.from(new Set([...selected, ...visible.map((p) => p.id)])))} className="text-aurum-deep hover:underline">
            Select all
          </button>
          <button type="button" onClick={() => onChange(selected.filter((id) => !visible.some((p) => p.id === id)))} className="text-aurum-obsidian/50 hover:underline">
            Clear
          </button>
        </div>
      </div>
      {products.length > 6 && (
        <div className="mb-2 flex items-center gap-2 border border-aurum-obsidian/15 px-3 py-2 text-sm">
          <Search size={14} strokeWidth={1.5} className="text-aurum-obsidian/40" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search products…" className="w-full bg-transparent focus-visible:outline-none" />
        </div>
      )}
      {products.length === 0 ? (
        <p className="text-sm text-aurum-obsidian/40">No products yet — add some under Products first.</p>
      ) : (
        <div className="grid max-h-56 grid-cols-1 gap-1 overflow-y-auto border border-aurum-obsidian/10 p-2 sm:grid-cols-2">
          {visible.map((p) => (
            <label key={p.id} className="flex cursor-pointer items-center gap-2 px-2 py-1.5 text-sm hover:bg-aurum-ivory">
              <input type="checkbox" checked={selected.includes(p.id)} onChange={() => toggle(p.id)} className="accent-aurum-deep" />
              <span className="truncate">{p.name}</span>
              {p.isActive === false && <span className="text-[10px] uppercase tracking-widest text-aurum-obsidian/40">Archived</span>}
            </label>
          ))}
          {visible.length === 0 && <p className="px-2 py-1.5 text-sm text-aurum-obsidian/40">No products match.</p>}
        </div>
      )}
    </div>
  );
}
