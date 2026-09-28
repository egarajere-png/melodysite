"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function OrderLookupForm() {
  const router = useRouter();
  const [orderId, setOrderId] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!orderId.trim()) return;
    router.push(`/orders/${orderId.trim().toUpperCase()}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <input
        value={orderId}
        onChange={(e) => setOrderId(e.target.value)}
        placeholder="e.g. AE-9016FBAB"
        aria-label="Order reference"
        className="w-full border-b border-aurum-obsidian/25 bg-transparent py-3 text-sm placeholder:text-aurum-obsidian/40 focus-visible:border-aurum-obsidian focus-visible:outline-none"
      />
      <button
        type="submit"
        className="self-start bg-aurum-deep px-8 py-4 text-xs uppercase tracking-[0.2em] text-aurum-ivory transition-colors hover:bg-aurum-plum"
      >
        Track Order
      </button>
    </form>
  );
}
