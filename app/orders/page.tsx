"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { RevealText } from "@/components/motion/RevealText";
import { getOrder } from "@/data/orders";

export default function OrderLookupPage() {
  const router = useRouter();
  const [orderId, setOrderId] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const order = getOrder(orderId.trim().toUpperCase());
    if (!order) {
      setError("We couldn't find an order with that reference. Check the ID and try again.");
      return;
    }
    router.push(`/orders/${order.id}`);
  }

  return (
    <div className="pt-32 pb-24 sm:pt-40">
      <div className="container-aurum max-w-md">
        <RevealText as="h1" text="Track Your Order" className="mb-6 font-display text-4xl sm:text-5xl" />
        <p className="mb-8 text-sm text-aurum-obsidian/60">
          Enter your order reference to see its current status. You&apos;ll find this in your order confirmation.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            placeholder="e.g. AE-10231"
            aria-label="Order reference"
            className="w-full border-b border-aurum-obsidian/25 bg-transparent py-3 text-sm placeholder:text-aurum-obsidian/40 focus-visible:border-aurum-obsidian focus-visible:outline-none"
          />
          {error && <p className="text-sm text-aurum-earth">{error}</p>}
          <button
            type="submit"
            className="self-start bg-aurum-deep px-8 py-4 text-xs uppercase tracking-[0.2em] text-aurum-ivory transition-colors hover:bg-aurum-plum"
          >
            Track Order
          </button>
        </form>
      </div>
    </div>
  );
}
