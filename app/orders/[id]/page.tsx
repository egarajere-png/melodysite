import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getOrder } from "@/data/orders";
import { RevealText } from "@/components/motion/RevealText";
import { OrderTimeline } from "@/components/orders/OrderTimeline";
import { EditorialImage } from "@/components/ui/EditorialImage";
import { formatKES, formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Order Status", robots: { index: false, follow: false } };

export default async function OrderStatusPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = getOrder(id.toUpperCase());
  if (!order) notFound();

  return (
    <div className="pt-32 pb-24 sm:pt-40">
      <div className="container-aurum grid gap-16 lg:grid-cols-[1.1fr_1fr] lg:gap-24">
        <div>
          <p className="mb-3 text-xs uppercase tracking-widest text-aurum-obsidian/50">Order {order.id}</p>
          <RevealText as="h1" text="Your Order" className="mb-2 font-display text-4xl sm:text-5xl" />
          <p className="mb-10 text-sm text-aurum-obsidian/60">Placed {formatDate(order.createdAt)}</p>
          <OrderTimeline order={order} />
        </div>

        <div className="border border-[var(--border-subtle)] p-6 lg:h-fit">
          <h2 className="mb-6 font-display text-xl">Items</h2>
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
          <div className="mt-6 flex items-center justify-between border-t border-[var(--border-subtle)] pt-4 font-display text-lg">
            <span>Subtotal</span>
            <span>{formatKES(order.subtotal)}</span>
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
