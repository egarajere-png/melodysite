import { formatDate } from "@/lib/format";
import { Check } from "lucide-react";
import type { OrderStatus, FulfilmentMethod } from "@/lib/supabase/database.types";
import type { OrderStatusEvent } from "@/lib/supabase/orders-customer";

const DELIVERY_STEPS: OrderStatus[] = [
  "PAYMENT_PENDING",
  "PAYMENT_CONFIRMED",
  "PROCESSING",
  "DISPATCHED",
  "IN_TRANSIT",
  "DELIVERED",
  "COMPLETED",
];
const COLLECTION_STEPS: OrderStatus[] = ["PAYMENT_PENDING", "PAYMENT_CONFIRMED", "PROCESSING", "READY_FOR_COLLECTION", "COMPLETED"];

export const STEP_LABELS: Record<OrderStatus, string> = {
  PAYMENT_PENDING: "Order Placed",
  PAYMENT_CONFIRMED: "Payment Received",
  PROCESSING: "Processing",
  READY_FOR_COLLECTION: "Ready for Collection",
  DISPATCHED: "Dispatched",
  IN_TRANSIT: "In Transit",
  DELIVERED: "Delivered",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
};

const STEP_DESCRIPTIONS: Record<OrderStatus, string> = {
  PAYMENT_PENDING: "Order placed, awaiting payment confirmation.",
  PAYMENT_CONFIRMED: "Payment confirmed — your order is queued for production.",
  PROCESSING: "Your piece is being finished and quality-checked.",
  READY_FOR_COLLECTION: "Available for pickup at our studio.",
  DISPATCHED: "Handed to our courier.",
  IN_TRANSIT: "On its way to you.",
  DELIVERED: "Delivered to your address.",
  COMPLETED: "Enjoy your piece.",
  CANCELLED: "This order was cancelled.",
  REFUNDED: "This order was refunded.",
};

export function OrderTimeline({
  status,
  fulfilment,
  history,
}: {
  status: OrderStatus;
  fulfilment: FulfilmentMethod;
  history: OrderStatusEvent[];
}) {
  if (status === "CANCELLED" || status === "REFUNDED") {
    return (
      <div className="border border-aurum-obsidian/15 p-6">
        <p className="font-display text-xl">{STEP_LABELS[status]}</p>
        <p className="mt-2 text-sm text-aurum-obsidian/60">{STEP_DESCRIPTIONS[status]}</p>
      </div>
    );
  }

  const steps = fulfilment === "DELIVERY" ? DELIVERY_STEPS : COLLECTION_STEPS;
  const currentIndex = steps.indexOf(status);

  return (
    <ol className="flex flex-col gap-0">
      {steps.map((step, i) => {
        const done = i <= currentIndex;
        const historyEntry = history.find((h) => h.status === step);
        return (
          <li key={step} className="flex gap-4 pb-8 last:pb-0">
            <div className="flex flex-col items-center">
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs ${
                  done ? "border-aurum-deep bg-aurum-deep text-aurum-ivory" : "border-aurum-obsidian/25 text-aurum-obsidian/40"
                }`}
              >
                {done ? <Check size={14} strokeWidth={2} /> : i + 1}
              </span>
              {i < steps.length - 1 && (
                <span className={`mt-1 w-px flex-1 ${i < currentIndex ? "bg-aurum-deep" : "bg-aurum-obsidian/15"}`} />
              )}
            </div>
            <div className="pt-1">
              <p className={`text-sm uppercase tracking-widest ${done ? "text-aurum-obsidian" : "text-aurum-obsidian/40"}`}>
                {STEP_LABELS[step]}
              </p>
              <p className="mt-1 text-sm text-aurum-obsidian/60">{STEP_DESCRIPTIONS[step]}</p>
              {historyEntry && (
                <p className="mt-1 text-xs text-aurum-obsidian/40">
                  {formatDate(historyEntry.timestamp)}
                  {historyEntry.note ? ` — ${historyEntry.note}` : ""}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
