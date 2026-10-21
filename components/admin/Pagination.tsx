"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

export const PAGE_SIZE = 10;

/** The rows for one page; `page` is 1-based and clamped to the pages that exist. */
export function pageOf<T>(rows: T[], page: number): { rows: T[]; page: number; pages: number } {
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const current = Math.min(Math.max(1, page), pages);
  return { rows: rows.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE), page: current, pages };
}

const btn =
  "flex items-center gap-1 border border-aurum-obsidian/15 bg-white px-3 py-2 text-xs uppercase tracking-widest transition-colors hover:border-aurum-obsidian disabled:pointer-events-none disabled:opacity-35";

/** "Showing 11–20 of 43 products", Previous / Page 2 of 5 / Next. */
export function Pagination({ page, pages, total, noun, onChange }: { page: number; pages: number; total: number; noun: string; onChange: (page: number) => void }) {
  if (total === 0) return null;
  const first = (page - 1) * PAGE_SIZE + 1;
  const last = Math.min(page * PAGE_SIZE, total);
  return (
    <nav aria-label={`${noun} pages`} className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
      <p className="text-aurum-obsidian/55">
        Showing {first}–{last} of {total} {total === 1 ? noun.replace(/s$/, "") : noun}
      </p>
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => onChange(page - 1)} disabled={page <= 1} className={btn}>
          <ChevronLeft size={14} strokeWidth={1.5} /> Previous
        </button>
        <span className="whitespace-nowrap text-aurum-obsidian/60">
          Page {page} of {pages}
        </span>
        <button type="button" onClick={() => onChange(page + 1)} disabled={page >= pages} className={btn}>
          Next <ChevronRight size={14} strokeWidth={1.5} />
        </button>
      </div>
    </nav>
  );
}
