"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { formatKES, formatDate } from "@/lib/format";
import type { OrderStatus } from "@/lib/supabase/database.types";
import type { AdminOrderSummary } from "@/lib/supabase/orders-admin";
import { STEP_LABELS } from "@/components/orders/OrderTimeline";
import { Pagination, pageOf } from "@/components/admin/Pagination";

type FulfilmentFilter = "All" | "DELIVERY" | "COLLECTION";
const FULFILMENT_LABELS: Record<"DELIVERY" | "COLLECTION", string> = { DELIVERY: "Pick Up Mtaani", COLLECTION: "Shop pickup" };

const control = "border border-aurum-obsidian/15 bg-white px-3 py-2.5 text-sm";

/** "2026-10-21" in Nairobi time, to compare with the date inputs. */
const nairobiDay = (iso: string) => new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Nairobi" }).format(new Date(iso));

const STATUSES: (OrderStatus | "All")[] = [
  "All",
  "PAYMENT_PENDING",
  "PAYMENT_CONFIRMED",
  "PROCESSING",
  "READY_FOR_COLLECTION",
  "DISPATCHED",
  "IN_TRANSIT",
  "DELIVERED",
  "COMPLETED",
  "CANCELLED",
  "REFUNDED",
];

export function AdminOrdersTable({ orders }: { orders: AdminOrderSummary[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<OrderStatus | "All">("All");
  const [fulfilment, setFulfilment] = useState<FulfilmentFilter>("All");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((o) => {
      const day = nairobiDay(o.createdAt);
      return (
        (status === "All" || o.status === status) &&
        (fulfilment === "All" || o.fulfilment === fulfilment) &&
        (!from || day >= from) &&
        (!to || day <= to) &&
        (!q || o.orderNumber.toLowerCase().includes(q) || o.customerName.toLowerCase().includes(q))
      );
    });
  }, [query, status, fulfilment, from, to, orders]);
  const shown = pageOf(filtered, page);
  const filtering = Boolean(query.trim()) || status !== "All" || fulfilment !== "All" || Boolean(from) || Boolean(to);

  /** Any filter change goes back to the first page. */
  function update<T>(set: (v: T) => void) {
    return (v: T) => {
      set(v);
      setPage(1);
    };
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2 border border-aurum-obsidian/15 bg-white px-4 py-2.5 text-sm sm:max-w-xs">
          <Search size={16} strokeWidth={1.5} className="shrink-0 text-aurum-obsidian/40" />
          <input
            value={query}
            onChange={(e) => update(setQuery)(e.target.value)}
            placeholder="Order number or customer name…"
            aria-label="Search orders"
            className="w-full bg-transparent focus-visible:outline-none"
          />
        </div>
        <select value={status} onChange={(e) => update(setStatus)(e.target.value as OrderStatus | "All")} aria-label="Status" className={control}>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s === "All" ? "All statuses" : STEP_LABELS[s]}
            </option>
          ))}
        </select>
        <select value={fulfilment} onChange={(e) => update(setFulfilment)(e.target.value as FulfilmentFilter)} aria-label="Fulfilment" className={control}>
          <option value="All">All fulfilment</option>
          <option value="DELIVERY">{FULFILMENT_LABELS.DELIVERY}</option>
          <option value="COLLECTION">{FULFILMENT_LABELS.COLLECTION}</option>
        </select>
        <label className="flex flex-col text-[11px] uppercase tracking-widest text-aurum-obsidian/50">
          From
          <input type="date" value={from} max={to || undefined} onChange={(e) => update(setFrom)(e.target.value)} className={`${control} mt-1 normal-case tracking-normal text-aurum-obsidian`} />
        </label>
        <label className="flex flex-col text-[11px] uppercase tracking-widest text-aurum-obsidian/50">
          To
          <input type="date" value={to} min={from || undefined} onChange={(e) => update(setTo)(e.target.value)} className={`${control} mt-1 normal-case tracking-normal text-aurum-obsidian`} />
        </label>
        {filtering && (
          <button
            type="button"
            onClick={() => { setQuery(""); setStatus("All"); setFulfilment("All"); setFrom(""); setTo(""); setPage(1); }}
            className="pb-3 text-xs uppercase tracking-widest text-aurum-obsidian/60 underline-offset-4 hover:underline"
          >
            Clear
          </button>
        )}
      </div>

      <div className="overflow-x-auto border border-aurum-obsidian/10 bg-white">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="border-b border-aurum-obsidian/10 text-xs uppercase tracking-widest text-aurum-obsidian/50">
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Fulfilment</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-aurum-obsidian/50">
                  {filtering ? "No orders match those filters." : "No orders yet."}
                </td>
              </tr>
            ) : (
              shown.rows.map((o) => (
                <tr key={o.id} className="border-b border-aurum-obsidian/5 last:border-0 hover:bg-aurum-ivory/60">
                  <td className="px-4 py-3">
                    <Link href={`/admin/orders/${o.orderNumber}`} className="font-medium hover:underline">
                      {o.orderNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    {o.customerName}
                    {o.isGuest && <span className="ml-2 bg-aurum-obsidian/10 px-1.5 py-0.5 text-[10px] uppercase tracking-widest text-aurum-obsidian/60">Guest</span>}
                  </td>
                  <td className="px-4 py-3 text-aurum-obsidian/60">{formatDate(o.createdAt)}</td>
                  <td className="px-4 py-3 text-aurum-obsidian/60">{FULFILMENT_LABELS[o.fulfilment]}</td>
                  <td className="px-4 py-3">{formatKES(o.total)}</td>
                  <td className="px-4 py-3">
                    <span className="border border-aurum-obsidian/15 px-2 py-1 text-xs uppercase tracking-wide">
                      {STEP_LABELS[o.status]}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={shown.page} pages={shown.pages} total={filtered.length} noun="orders" onChange={setPage} />
    </div>
  );
}
