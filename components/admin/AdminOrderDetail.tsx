"use client";

import { useState } from "react";
import { formatKES, formatDate } from "@/lib/format";
import { EditorialImage } from "@/components/ui/EditorialImage";
import { STEP_LABELS } from "@/components/orders/OrderTimeline";
import { updateOrderStatusAction } from "@/app/actions/admin-orders";
import type { OrderStatus } from "@/lib/supabase/database.types";
import type { AdminOrderDetail as AdminOrderDetailType } from "@/lib/supabase/orders-admin";
import { useToast } from "@/components/admin/Toast";

const ALL_STATUSES: OrderStatus[] = [
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

export function AdminOrderDetail({ order }: { order: AdminOrderDetailType }) {
  const toast = useToast();
  const [status, setStatus] = useState<OrderStatus>(order.status);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    const result = await updateOrderStatusAction(order.id, status, note.trim() || undefined);
    setSaving(false);
    setMessage(result.ok ? "Status updated." : result.error);
    if (result.ok) {
      setNote("");
      toast.success(`Order ${order.orderNumber} is now ${STEP_LABELS[status]}.`);
    } else {
      toast.error(result.error);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
      <div className="border border-aurum-obsidian/10 bg-white p-6">
        <h2 className="mb-4 font-display text-xl">Items</h2>
        <ul className="flex flex-col gap-4">
          {order.items.map((item) => (
            <li key={item.id} className="flex gap-4">
              <EditorialImage image={item.image} className="h-16 w-14 shrink-0" />
              <div className="flex flex-1 items-start justify-between text-sm">
                <div>
                  <p>{item.name}</p>
                  <p className="text-xs text-aurum-obsidian/50">
                    {item.variantLabel} · SKU {item.sku ?? "—"} · Qty {item.quantity}
                  </p>
                </div>
                <p>{formatKES(item.unitPrice * item.quantity)}</p>
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-6 flex flex-col gap-2 border-t border-aurum-obsidian/10 pt-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-aurum-obsidian/60">Subtotal</span>
            <span>{formatKES(order.subtotal)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-aurum-obsidian/60">Shipping</span>
            <span>{formatKES(order.shippingTotal)}</span>
          </div>
          <div className="flex items-center justify-between font-display text-lg">
            <span>Total</span>
            <span>{formatKES(order.total)}</span>
          </div>
        </div>

        {order.personalizedMessage && (
          <div className="mt-6 border-t border-aurum-obsidian/10 pt-4">
            <h2 className="mb-2 font-display text-lg">Gift Message</h2>
            <p className="text-sm">To {order.personalizedMessage.recipientName}</p>
            <p className="text-sm text-aurum-obsidian/70">{order.personalizedMessage.message}</p>
          </div>
        )}

        <div className="mt-8">
          <h2 className="mb-3 font-display text-lg">History</h2>
          <ul className="flex flex-col gap-2 text-sm text-aurum-obsidian/70">
            {order.history.map((h) => (
              <li key={h.status + h.timestamp}>
                {formatDate(h.timestamp)} — {STEP_LABELS[h.status]}
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
          <p className="text-sm text-aurum-obsidian/60">{order.customerEmail ?? "No email on file"}</p>
          {order.customerPhone && <p className="text-sm text-aurum-obsidian/60">{order.customerPhone}</p>}
        </div>

        <div className="border border-aurum-obsidian/10 bg-white p-6">
          <h2 className="mb-3 font-display text-lg">Fulfilment</h2>
          <p className="text-sm capitalize">{order.fulfilment.toLowerCase()}</p>
          {order.shippingAddress && (
            <p className="mt-1 text-sm text-aurum-obsidian/60">
              {order.shippingAddress.recipient_name}, {order.shippingAddress.address_line_1}, {order.shippingAddress.city}
            </p>
          )}
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
                {STEP_LABELS[s]}
              </option>
            ))}
          </select>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note (optional)"
            className="mt-3 w-full border border-aurum-obsidian/15 px-3 py-2.5 text-sm"
          />
          <button
            onClick={handleSave}
            disabled={saving}
            className="mt-4 w-full bg-aurum-deep px-6 py-3 text-xs uppercase tracking-widest text-aurum-ivory transition-colors hover:bg-aurum-plum disabled:opacity-60"
          >
            {saving ? "Saving…" : "Update Status"}
          </button>
          {message && <p className="mt-2 text-sm text-aurum-obsidian/70">{message}</p>}
        </div>
      </div>
    </div>
  );
}
