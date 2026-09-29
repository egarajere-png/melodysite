import type { Metadata } from "next";
import Link from "next/link";
import { RevealText } from "@/components/motion/RevealText";
import { OrderLookupForm } from "@/components/orders/OrderLookupForm";
import { STEP_LABELS } from "@/components/orders/OrderTimeline";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getCustomerOrders } from "@/lib/supabase/orders-customer";
import { formatKES, formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Track Your Order" };

export default async function OrderLookupPage() {
  const user = isSupabaseConfigured() ? (await (await createClient()).auth.getUser()).data.user : null;
  const orders = user ? await getCustomerOrders(user.id) : [];

  return (
    <div className="pt-32 pb-24 sm:pt-40">
      <div className="container-aurum max-w-md">
        <RevealText as="h1" text="Track Your Order" className="mb-6 font-display text-4xl sm:text-5xl" />

        {orders.length > 0 && (
          <div className="mb-12 flex flex-col gap-2">
            <p className="mb-2 text-xs uppercase tracking-widest text-aurum-obsidian/50">Your Orders</p>
            {orders.map((o) => (
              <Link
                key={o.id}
                href={`/orders/${o.orderNumber}`}
                className="flex items-center justify-between border border-[var(--border-subtle)] px-4 py-3 text-sm transition-colors hover:border-aurum-obsidian"
              >
                <span>
                  <span className="font-medium">{o.orderNumber}</span>{" "}
                  <span className="text-aurum-obsidian/50">· {formatDate(o.createdAt)}</span>
                </span>
                <span className="text-xs uppercase tracking-widest text-aurum-obsidian/60">
                  {STEP_LABELS[o.status]} · {formatKES(o.total)}
                </span>
              </Link>
            ))}
          </div>
        )}

        <p className="mb-8 text-sm text-aurum-obsidian/60">
          {orders.length > 0
            ? "Or look up an order with its number and the email used at checkout."
            : "Enter your order number and the email you used at checkout. You'll find the number in your order confirmation."}
        </p>
        <OrderLookupForm />
      </div>
    </div>
  );
}
