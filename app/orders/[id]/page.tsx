import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getOrderByNumber } from "@/lib/supabase/orders-customer";
import { RevealText } from "@/components/motion/RevealText";
import { OrderTimeline } from "@/components/orders/OrderTimeline";
import { EditorialImage } from "@/components/ui/EditorialImage";
import { formatKES, formatDate } from "@/lib/format";
import { describeFulfilment } from "@/lib/delivery";
import { MpesaPayment } from "@/components/checkout/MpesaPayment";
import { getMpesaPaymentView } from "@/lib/supabase/payments";

export const metadata: Metadata = { title: "Order Status", robots: { index: false, follow: false } };

export default async function OrderStatusPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ t?: string | string[] }> }) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const token = Array.isArray(sp.t) ? sp.t[0] : sp.t;
  const order = await getOrderByNumber(id.toUpperCase(), token);
  if (!order) notFound();
  const fulfilment = describeFulfilment(order.fulfilment, order.shippingAddress);
  // Unpaid orders can be paid from here, so closing the checkout tab never strands one.
  const payment = order.status === "PAYMENT_PENDING" ? await getMpesaPaymentView(order.id).catch(() => null) : null;

  return (
    <div className="pt-32 pb-24 sm:pt-40">
      <div className="container-aurum grid gap-16 lg:grid-cols-[1.1fr_1fr] lg:gap-24">
        <div>
          <p className="mb-3 text-xs uppercase tracking-widest text-aurum-obsidian/50">Order {order.orderNumber}</p>
          <RevealText as="h1" text="Your Order" className="mb-2 font-display text-4xl sm:text-5xl" />
          <p className="mb-10 text-sm text-aurum-obsidian/60">Placed {formatDate(order.createdAt)}</p>
          {payment && (
            <div className="mb-10">
              <MpesaPayment orderNumber={order.orderNumber} accessToken={token} total={order.total} defaultPhone={order.contactPhone ?? ""} initial={payment} refreshOnPaid />
            </div>
          )}
          <OrderTimeline status={order.status} fulfilment={order.fulfilment} history={order.history} />

          <div className="mt-10 border border-[var(--border-subtle)] p-6">
            <p className="mb-2 text-xs uppercase tracking-widest text-aurum-obsidian/50">{order.fulfilment === "COLLECTION" ? "Pickup" : "Delivery"}</p>
            <p className="font-display text-lg">{fulfilment.headline.replace(/^(Delivery|Pickup) · /, "")}</p>
            <dl className="mt-3 flex flex-col gap-1.5 text-sm">
              {fulfilment.details.map((d) => (
                <div key={d.label} className="flex flex-wrap gap-x-2">
                  <dt className="text-aurum-obsidian/50">{d.label}:</dt>
                  <dd>{d.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {order.personalizedMessage && (
            <div className="mt-10 border border-[var(--border-subtle)] p-6">
              <p className="mb-2 text-xs uppercase tracking-widest text-aurum-obsidian/50">Gift Message</p>
              <p className="font-display text-lg">To {order.personalizedMessage.recipientName}</p>
              <p className="mt-2 text-sm text-aurum-obsidian/70">{order.personalizedMessage.message}</p>
            </div>
          )}
        </div>

        <div className="border border-[var(--border-subtle)] p-6 lg:h-fit">
          <h2 className="mb-6 font-display text-xl">Items</h2>
          <ul className="flex flex-col gap-4">
            {order.items.map((item) => (
              <li key={item.id} className="flex gap-4">
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
          <div className="mt-6 flex flex-col gap-2 border-t border-[var(--border-subtle)] pt-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-aurum-obsidian/60">Subtotal</span>
              <span>{formatKES(order.subtotal)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-aurum-obsidian/60">{order.fulfilment === "COLLECTION" ? "Pickup" : "Delivery"}</span>
              <span>{order.shippingTotal > 0 ? formatKES(order.shippingTotal) : "Free"}</span>
            </div>
            <div className="flex items-center justify-between border-t border-[var(--border-subtle)] pt-2 font-display text-lg">
              <span>Total</span>
              <span>{formatKES(order.total)}</span>
            </div>
          </div>
          <p className="mt-6 text-xs text-aurum-obsidian/50">
            Questions about this order?{" "}
            <Link href="/contact" className="underline underline-offset-4">
              Contact us
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
