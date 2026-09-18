import type { Order, OrderStatus } from "@/lib/types";
import { formatDate } from "@/lib/format";
import { Check } from "lucide-react";

const DELIVERY_STEPS: OrderStatus[] = ["Pending Payment", "Payment Received", "Processing", "Dispatched", "Completed"];
const COLLECTION_STEPS: OrderStatus[] = [
  "Pending Payment",
  "Payment Received",
  "Processing",
  "Ready for Collection",
  "Completed",
];

const STEP_DESCRIPTIONS: Record<OrderStatus, string> = {
  "Pending Payment": "Order placed, awaiting payment confirmation.",
  "Payment Received": "Payment confirmed — your order is queued for production.",
  Processing: "Your piece is being finished and quality-checked.",
  "Ready for Collection": "Available for pickup at our studio.",
  Dispatched: "On its way to you.",
  Completed: "Delivered — enjoy your piece.",
  Cancelled: "This order was cancelled.",
  Refunded: "This order was refunded.",
};

export function OrderTimeline({ order }: { order: Order }) {
  if (order.status === "Cancelled" || order.status === "Refunded") {
    return (
      <div className="border border-aurum-obsidian/15 p-6">
        <p className="font-display text-xl">{order.status}</p>
        <p className="mt-2 text-sm text-aurum-obsidian/60">{STEP_DESCRIPTIONS[order.status]}</p>
      </div>
    );
  }

  const steps = order.fulfilment === "delivery" ? DELIVERY_STEPS : COLLECTION_STEPS;
  const currentIndex = steps.indexOf(order.status);

  return (
    <ol className="flex flex-col gap-0">
      {steps.map((step, i) => {
        const done = i <= currentIndex;
        const historyEntry = order.history.find((h) => h.status === step);
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
                {step}
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
