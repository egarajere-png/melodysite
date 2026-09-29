"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { formatKES, formatDate } from "@/lib/format";
import type { OrderStatus } from "@/lib/supabase/database.types";
import type { AdminOrderSummary } from "@/lib/supabase/orders-admin";
import { STEP_LABELS } from "@/components/orders/OrderTimeline";

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

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const matchesStatus = status === "All" || o.status === status;
      const q = query.trim().toLowerCase();
      const matchesQuery = !q || o.orderNumber.toLowerCase().includes(q) || o.customerName.toLowerCase().includes(q);
      return matchesStatus && matchesQuery;
    });
  }, [query, status, orders]);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 border border-aurum-obsidian/15 bg-white px-4 py-2.5 text-sm sm:max-w-xs">
          <Search size={16} strokeWidth={1.5} className="text-aurum-obsidian/40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search order # or customer…"
            className="w-full bg-transparent focus-visible:outline-none"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as OrderStatus | "All")}
          className="border border-aurum-obsidian/15 bg-white px-3 py-2.5 text-sm"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s === "All" ? "All" : STEP_LABELS[s]}
            </option>
          ))}
        </select>
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
                  No orders match those filters.
                </td>
              </tr>
            ) : (
              filtered.map((o) => (
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
                  <td className="px-4 py-3 capitalize text-aurum-obsidian/60">{o.fulfilment.toLowerCase()}</td>
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
    </div>
  );
}
