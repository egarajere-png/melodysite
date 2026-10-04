"use client";

import { useState } from "react";
import { formatKES, formatDate } from "@/lib/format";
import { EditorialImage } from "@/components/ui/EditorialImage";
import { STEP_LABELS } from "@/components/orders/OrderTimeline";
import { updateOrderStatusAction } from "@/app/actions/admin-orders";
import type { OrderStatus, PaymentStatus } from "@/lib/supabase/database.types";
import type { AdminOrderDetail as AdminOrderDetailType } from "@/lib/supabase/orders-admin";
import { useToast } from "@/components/admin/Toast";
import { describeFulfilment } from "@/lib/delivery";

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

const PAYMENT_LABELS: Record<PaymentStatus, string> = {
  PENDING: "Sending request",
  PROCESSING: "Awaiting PIN",
  SUCCEEDED: "Paid",
  FAILED: "Failed",
  CANCELLED: "Cancelled by customer",
  REFUNDED: "Refunded",
};

/** "order.IN_TRANSIT" → "In Transit"; "admin.paid_order" → "Admin alert". */
function notificationLabel(eventType: string): string {
  if (eventType === "admin.paid_order") return "Admin alert";
  return STEP_LABELS[eventType.replace("order.", "") as OrderStatus] ?? eventType;
}

export function AdminOrderDetail({ order }: { order: AdminOrderDetailType }) {
  const toast = useToast();
  const fulfilment = describeFulfilment(order.fulfilment, order.shippingAddress);
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
          <p className="text-sm">
            {order.customerName}
            {order.isGuest && <span className="ml-2 bg-aurum-obsidian/10 px-2 py-0.5 align-middle text-[10px] uppercase tracking-widest text-aurum-obsidian/60">Guest</span>}
          </p>
          {(order.contactEmail ?? order.customerEmail) && (
            <a href={`mailto:${order.contactEmail ?? order.customerEmail}`} className="block text-sm text-aurum-obsidian/70 underline-offset-4 hover:underline">
              {order.contactEmail ?? order.customerEmail}
            </a>
          )}
          {(order.contactPhone ?? order.customerPhone) && (
            <a href={`tel:${order.contactPhone ?? order.customerPhone}`} className="block text-sm text-aurum-obsidian/70 underline-offset-4 hover:underline">
              {order.contactPhone ?? order.customerPhone}
            </a>
          )}
          {!order.contactEmail && !order.customerEmail && <p className="text-sm text-aurum-obsidian/50">No email on file</p>}
        </div>

        <div className="border-2 border-aurum-obsidian bg-white p-6">
          <p className="text-[11px] uppercase tracking-widest text-aurum-obsidian/50">{order.fulfilment === "COLLECTION" ? "Pickup" : "Deliver to"}</p>
          <h2 className="mt-1 font-display text-xl">{fulfilment.headline.replace(/^(Delivery|Pickup) · /, "")}</h2>
          <dl className="mt-4 flex flex-col gap-2.5 text-sm">
            {fulfilment.details.map((d) => (
              <div key={d.label} className="grid grid-cols-[8.5rem_1fr] gap-3">
                <dt className="text-aurum-obsidian/50">{d.label}</dt>
                <dd className={d.label === "Exact location" ? "font-medium" : ""}>
                  {/phone/i.test(d.label) ? (
                    <a href={`tel:${d.value}`} className="underline-offset-4 hover:underline">
                      {d.value}
                    </a>
                  ) : (
                    d.value
                  )}
                </dd>
              </div>
            ))}
            {fulfilment.details.length === 0 && <p className="text-aurum-obsidian/50">No delivery details were recorded for this order.</p>}
          </dl>
          {fulfilment.mapsUrl && (
            <a
              href={fulfilment.mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-1.5 border border-aurum-obsidian/15 px-3 py-1.5 text-xs uppercase tracking-widest transition-colors hover:border-aurum-obsidian"
            >
              Open in Google Maps
            </a>
          )}
          <p className="mt-4 border-t border-aurum-obsidian/10 pt-3 text-xs text-aurum-obsidian/50">
            {order.fulfilment === "COLLECTION" ? "No delivery fee." : `Delivery fee paid: ${formatKES(order.shippingTotal)}`}
          </p>
        </div>

        <div className="border border-aurum-obsidian/10 bg-white p-6">
          <h2 className="mb-3 font-display text-lg">Payment</h2>
          {order.payments.length === 0 ? (
            <p className="text-sm text-aurum-obsidian/50">No M-Pesa payment has been attempted for this order.</p>
          ) : (
            <ul className="flex flex-col gap-3 text-sm">
              {order.payments.map((p) => (
                <li key={p.id} className="border-b border-aurum-obsidian/10 pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between gap-3">
                    <span className={p.status === "SUCCEEDED" ? "font-medium" : "text-aurum-obsidian/60"}>{PAYMENT_LABELS[p.status]}</span>
                    <span>{formatKES(p.amount)}</span>
                  </div>
                  <p className="text-xs text-aurum-obsidian/50">
                    {formatDate(p.createdAt)}
                    {p.phone ? ` · ${p.phone}` : ""}
                    {p.receipt ? ` · Receipt ${p.receipt}` : ""}
                  </p>
                  {p.status !== "SUCCEEDED" && p.failureReason && <p className="mt-1 text-xs text-aurum-obsidian/50">{p.failureReason}</p>}
                </li>
              ))}
            </ul>
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
          <p className="mt-3 text-xs text-aurum-obsidian/50">Changing the status emails and WhatsApps the customer.</p>
        </div>

        <div className="border border-aurum-obsidian/10 bg-white p-6">
          <h2 className="mb-3 font-display text-lg">Messages sent</h2>
          {order.notifications.length === 0 ? (
            <p className="text-sm text-aurum-obsidian/50">Nothing has been sent about this order yet.</p>
          ) : (
            <ul className="flex flex-col gap-3 text-sm">
              {order.notifications.map((n) => (
                <li key={n.id} className="border-b border-aurum-obsidian/10 pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between gap-3">
                    <span>
                      {n.channel === "WHATSAPP" ? "WhatsApp" : "Email"} · {notificationLabel(n.eventType)}
                    </span>
                    <span className={n.status === "SENT" ? "text-aurum-obsidian/60" : "font-medium text-aurum-earth"}>{n.status === "SENT" ? "Sent" : "Failed"}</span>
                  </div>
                  <p className="break-all text-xs text-aurum-obsidian/50">
                    {formatDate(n.createdAt)} · {n.recipient}
                  </p>
                  {n.error && <p className="mt-1 text-xs text-aurum-earth">{n.error}</p>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
