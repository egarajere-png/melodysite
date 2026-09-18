"use client";

import { useState } from "react";
import type { Order, OrderStatus } from "@/lib/types";
import { formatKES, formatDate } from "@/lib/format";
import { EditorialImage } from "@/components/ui/EditorialImage";

const ALL_STATUSES: OrderStatus[] = [
  "Pending Payment",
  "Payment Received",
  "Processing",
  "Ready for Collection",
  "Dispatched",
  "Completed",
  "Cancelled",
  "Refunded",
];

export function AdminOrderDetail({ order }: { order: Order }) {
  const [status, setStatus] = useState<OrderStatus>(order.status);
  const [saved, setSaved] = useState(false);

  function handleSave() {
    // No backend connected yet — status change is local to this session only.
    setSaved(true);
    window.setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
      <div className="border border-aurum-obsidian/10 bg-white p-6">
        <h2 className="mb-4 font-display text-xl">Items</h2>
        <ul className="flex flex-col gap-4">
          {order.items.map((item) => (
            <li key={item.variantId} className="flex gap-4">
              <EditorialImage image={item.image} className="h-16 w-14 shrink-0" />
              <div className="flex flex-1 items-start justify-between text-sm">
                <div>
                  <p>{item.name}</p>
                  <p className="text-xs text-aurum-obsidian/50">
                    {item.variantLabel} · Qty {item.quantity}
                  </p>
                </div>
                <p>{formatKES(item.unitPrice * item.quantity)}</p>
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-6 flex items-center justify-between border-t border-aurum-obsidian/10 pt-4 font-display text-lg">
          <span>Subtotal</span>
          <span>{formatKES(order.subtotal)}</span>
        </div>

        <div className="mt-8">
          <h2 className="mb-3 font-display text-lg">History</h2>
          <ul className="flex flex-col gap-2 text-sm text-aurum-obsidian/70">
            {order.history.map((h) => (
              <li key={h.status + h.timestamp}>
                {formatDate(h.timestamp)} — {h.status}
                {h.note ? ` (${h.note})` : ""}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <div className="border border-aurum-obsidian/10 bg-white p-6">
          <h2 className="mb-3 font-display text-lg">Customer</h2>
          <p className="text-sm">{order.customerName}</p>
          <p className="text-sm text-aurum-obsidian/60">{order.customerEmail}</p>
        </div>

        <div className="border border-aurum-obsidian/10 bg-white p-6">
          <h2 className="mb-3 font-display text-lg">Fulfilment</h2>
          <p className="text-sm capitalize">{order.fulfilment}</p>
          {order.address && <p className="mt-1 text-sm text-aurum-obsidian/60">{order.address}</p>}
        </div>

        <div className="border border-aurum-obsidian/10 bg-white p-6">
          <h2 className="mb-3 font-display text-lg">Order Status</h2>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as OrderStatus)}
            className="w-full border border-aurum-obsidian/15 px-3 py-2.5 text-sm"
          >
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button
            onClick={handleSave}
            className="mt-4 w-full bg-aurum-deep px-6 py-3 text-xs uppercase tracking-widest text-aurum-ivory transition-colors hover:bg-aurum-plum"
          >
            Update Status
          </button>
          {saved && <p className="mt-2 text-sm text-green-800">Status updated (demo only — connect a backend to persist).</p>}
        </div>
      </div>
    </div>
  );
}
