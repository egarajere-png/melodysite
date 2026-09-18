"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { EditorialImage } from "@/components/ui/EditorialImage";
import { formatKES } from "@/lib/format";
import { initiateMpesaPayment } from "@/lib/payments/mpesa";

const inputClasses =
  "w-full border-b border-aurum-obsidian/25 bg-transparent py-3 text-sm placeholder:text-aurum-obsidian/40 focus-visible:border-aurum-obsidian focus-visible:outline-none";

type PaymentState = "idle" | "processing" | "unavailable" | "error";

export function CheckoutClient() {
  const { lines, subtotal, clearCart } = useCart();
  const [fulfilment, setFulfilment] = useState<"delivery" | "collection">("delivery");
  const [paymentState, setPaymentState] = useState<PaymentState>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [orderRef] = useState(() => `AE-${Date.now().toString(36).toUpperCase()}`);
  const [customer, setCustomer] = useState({ name: "", email: "", phone: "", address: "" });

  const whatsappHref = useMemo(() => {
    const itemLines = lines.map((l) => `• ${l.name} (${l.variantLabel}) x${l.quantity} — ${formatKES(l.unitPrice * l.quantity)}`);
    const text = [
      `Order ${orderRef}`,
      `Name: ${customer.name}`,
      `Phone: ${customer.phone}`,
      fulfilment === "delivery" ? `Deliver to: ${customer.address}` : "Collection from studio",
      "",
      ...itemLines,
      "",
      `Subtotal: ${formatKES(subtotal)}`,
    ].join("\n");
    return `https://wa.me/254700000000?text=${encodeURIComponent(text)}`;
  }, [lines, orderRef, customer, fulfilment, subtotal]);

  if (lines.length === 0 && paymentState === "idle") {
    return (
      <div className="flex flex-col items-center gap-4 py-24 text-center">
        <p className="text-sm text-aurum-obsidian/60">Your bag is empty.</p>
        <Link href="/shop" className="font-display text-lg underline underline-offset-4">
          Continue shopping
        </Link>
      </div>
    );
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!customer.name.trim() || !customer.phone.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) {
      setFormError("Please fill in your name, phone number, and a valid email.");
      return;
    }
    if (fulfilment === "delivery" && !customer.address.trim()) {
      setFormError("Please add a delivery address.");
      return;
    }
    setFormError(null);
    setPaymentState("processing");

    try {
      const result = await initiateMpesaPayment({ phone: customer.phone, amount: subtotal, orderRef });
      setPaymentState(result.status === "success" ? "idle" : result.status);
      setMessage(result.message);
      if (result.status === "success") clearCart();
    } catch {
      setPaymentState("error");
      setMessage("Something went wrong reaching the payment provider. Please try again or contact us directly.");
    }
  }

  return (
    <div className="grid gap-16 lg:grid-cols-[1.2fr_1fr] lg:gap-24">
      <div>
        {paymentState === "unavailable" ? (
          <div className="border border-aurum-gold/40 bg-aurum-gold/10 p-6">
            <p className="font-display text-xl">Almost there.</p>
            <p className="mt-2 text-sm leading-relaxed text-aurum-obsidian/80">{message}</p>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex items-center bg-aurum-deep px-8 py-4 text-xs uppercase tracking-[0.2em] text-aurum-ivory transition-colors hover:bg-aurum-plum"
            >
              Complete Order on WhatsApp
            </a>
            <p className="mt-4 text-xs text-aurum-obsidian/50">
              Order reference {orderRef} — quote this when you message us. Your bag has been kept as-is.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-8" noValidate>
            <div>
              <h2 className="mb-4 font-display text-2xl">Contact</h2>
              <div className="grid gap-6 sm:grid-cols-2">
                <input
                  aria-label="Full name"
                  placeholder="Full name"
                  required
                  value={customer.name}
                  onChange={(e) => setCustomer((c) => ({ ...c, name: e.target.value }))}
                  className={inputClasses}
                />
                <input
                  aria-label="Phone number"
                  placeholder="Phone (for M-Pesa & delivery)"
                  required
                  value={customer.phone}
                  onChange={(e) => setCustomer((c) => ({ ...c, phone: e.target.value }))}
                  className={inputClasses}
                />
                <input
                  aria-label="Email"
                  type="email"
                  placeholder="Email"
                  required
                  value={customer.email}
                  onChange={(e) => setCustomer((c) => ({ ...c, email: e.target.value }))}
                  className={`${inputClasses} sm:col-span-2`}
                />
              </div>
            </div>

            <div>
              <h2 className="mb-4 font-display text-2xl">Delivery</h2>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setFulfilment("delivery")}
                  className={`flex-1 border px-4 py-3 text-xs uppercase tracking-widest ${
                    fulfilment === "delivery" ? "border-aurum-obsidian bg-aurum-obsidian text-aurum-ivory" : "border-aurum-obsidian/25"
                  }`}
                >
                  Delivery
                </button>
                <button
                  type="button"
                  onClick={() => setFulfilment("collection")}
                  className={`flex-1 border px-4 py-3 text-xs uppercase tracking-widest ${
                    fulfilment === "collection" ? "border-aurum-obsidian bg-aurum-obsidian text-aurum-ivory" : "border-aurum-obsidian/25"
                  }`}
                >
                  Studio Collection
                </button>
              </div>
              {fulfilment === "delivery" ? (
                <textarea
                  aria-label="Delivery address"
                  placeholder="Delivery address"
                  required
                  rows={3}
                  value={customer.address}
                  onChange={(e) => setCustomer((c) => ({ ...c, address: e.target.value }))}
                  className={`${inputClasses} mt-4`}
                />
              ) : (
                <p className="mt-4 text-sm text-aurum-obsidian/60">
                  Collect from our Kilimani, Nairobi studio once your order is marked Ready for Collection.
                </p>
              )}
            </div>

            <div>
              <h2 className="mb-4 font-display text-2xl">Payment</h2>
              <p className="text-sm text-aurum-obsidian/60">Pay securely with M-Pesa once you place your order.</p>
            </div>

            {formError && <p className="text-sm text-aurum-earth">{formError}</p>}
            {paymentState === "error" && <p className="text-sm text-aurum-earth">{message}</p>}

            <button
              type="submit"
              disabled={paymentState === "processing"}
              className="bg-aurum-deep px-8 py-4 text-xs uppercase tracking-[0.2em] text-aurum-ivory transition-colors hover:bg-aurum-plum disabled:opacity-60"
            >
              {paymentState === "processing" ? "Processing…" : `Pay ${formatKES(subtotal)} with M-Pesa`}
            </button>
          </form>
        )}
      </div>

      <div className="border border-[var(--border-subtle)] p-6 lg:sticky lg:top-28 lg:h-fit">
        <h2 className="mb-6 font-display text-xl">Order Summary</h2>
        <ul className="flex flex-col gap-4">
          {lines.map((line) => (
            <li key={line.variantId} className="flex gap-4">
              <EditorialImage image={line.image} className="h-16 w-14 shrink-0" />
              <div className="flex flex-1 items-start justify-between text-sm">
                <div>
                  <p>{line.name}</p>
                  <p className="text-xs text-aurum-obsidian/50">
                    {line.variantLabel} · Qty {line.quantity}
                  </p>
                </div>
                <p>{formatKES(line.unitPrice * line.quantity)}</p>
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-6 flex items-center justify-between border-t border-[var(--border-subtle)] pt-4 font-display text-lg">
          <span>Subtotal</span>
          <span>{formatKES(subtotal)}</span>
        </div>
        <p className="mt-2 text-xs text-aurum-obsidian/50">Delivery calculated and confirmed at checkout by our team.</p>
      </div>
    </div>
  );
}
