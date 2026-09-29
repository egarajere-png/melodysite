"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { lookupOrderAction } from "@/app/actions/orders";

const input =
  "w-full border-b border-aurum-obsidian/25 bg-transparent py-3 text-sm placeholder:text-aurum-obsidian/40 focus-visible:border-aurum-obsidian focus-visible:outline-none";

export function OrderLookupForm() {
  const router = useRouter();
  const [orderId, setOrderId] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const result = await lookupOrderAction(orderId, email);
    if (result.ok) {
      router.push(result.href);
      return;
    }
    setError(result.error);
    setBusy(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <input value={orderId} onChange={(e) => setOrderId(e.target.value)} placeholder="Order number, e.g. AE-9016FBAB" aria-label="Order number" required className={input} />
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email used at checkout" aria-label="Email used at checkout" autoComplete="email" required className={input} />
      {error && (
        <p role="alert" className="text-sm text-aurum-earth">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={busy}
        className="self-start bg-aurum-deep px-8 py-4 text-xs uppercase tracking-[0.2em] text-aurum-ivory transition-colors hover:bg-aurum-plum disabled:opacity-60"
      >
        {busy ? "Looking up…" : "Track Order"}
      </button>
    </form>
  );
}
