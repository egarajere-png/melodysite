"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { EditorialImage } from "@/components/ui/EditorialImage";
import { formatKES } from "@/lib/format";
import { initiateMpesaPayment } from "@/lib/payments/mpesa";
import { createOrderAction } from "@/app/actions/checkout";
import type { Address } from "@/lib/supabase/addresses";
import type { ShippingRate } from "@/lib/supabase/shipping";

const inputClasses =
  "w-full border-b border-aurum-obsidian/25 bg-transparent py-3 text-sm placeholder:text-aurum-obsidian/40 focus-visible:border-aurum-obsidian focus-visible:outline-none";

type Stage = "form" | "placing" | "awaiting-payment" | "error";

export function CheckoutClient({ addresses, shippingRates }: { addresses: Address[]; shippingRates: ShippingRate[] }) {
  const { lines, subtotal, clearCart } = useCart();

  const [fulfilment, setFulfilment] = useState<"delivery" | "collection">("delivery");
  const [addressId, setAddressId] = useState<string | null>(addresses.find((a) => a.isDefault)?.id ?? addresses[0]?.id ?? null);
  const [usingNewAddress, setUsingNewAddress] = useState(addresses.length === 0);
  const [newAddress, setNewAddress] = useState({ recipientName: "", phone: "", addressLine1: "", addressLine2: "", city: "", region: "" });
  const [saveAddress, setSaveAddress] = useState(true);
  const [shippingRateId, setShippingRateId] = useState<string | null>(shippingRates[0]?.id ?? null);
  const [wantsMessage, setWantsMessage] = useState(false);
  const [giftMessage, setGiftMessage] = useState({ recipientName: "", message: "" });
  const [phone, setPhone] = useState("");

  const [stage, setStage] = useState<Stage>("form");
  const [error, setError] = useState<string | null>(null);
  const [placedOrder, setPlacedOrder] = useState<{ orderNumber: string; total: number } | null>(null);
  const [mpesaMessage, setMpesaMessage] = useState<string | null>(null);

  const shippingTotal = fulfilment === "delivery" ? (shippingRates.find((r) => r.id === shippingRateId)?.amount ?? 0) : 0;
  const total = subtotal + shippingTotal;

  const whatsappHref = useMemo(() => {
    if (!placedOrder) return "#";
    const itemLines = lines.map((l) => `• ${l.name} (${l.variantLabel}) x${l.quantity} — ${formatKES(l.unitPrice * l.quantity)}`);
    const text = [
      `Order ${placedOrder.orderNumber}`,
      `Phone: ${phone}`,
      fulfilment === "delivery" ? "Delivery order" : "Studio collection",
      "",
      ...itemLines,
      "",
      `Total: ${formatKES(placedOrder.total)}`,
    ].join("\n");
    return `https://wa.me/254700000000?text=${encodeURIComponent(text)}`;
  }, [placedOrder, lines, phone, fulfilment]);

  if (lines.length === 0 && stage === "form") {
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
    if (!phone.trim()) {
      setError("Please add a phone number.");
      return;
    }
    if (fulfilment === "delivery") {
      if (!usingNewAddress && !addressId) {
        setError("Please choose or add a delivery address.");
        return;
      }
      if (usingNewAddress && (!newAddress.recipientName.trim() || !newAddress.addressLine1.trim() || !newAddress.city.trim())) {
        setError("Please fill in the delivery address.");
        return;
      }
      if (!shippingRateId) {
        setError("Please choose a delivery option.");
        return;
      }
    }
    setError(null);
    setStage("placing");

    const result = await createOrderAction({
      fulfilment,
      addressId: fulfilment === "delivery" && !usingNewAddress ? (addressId ?? undefined) : undefined,
      newAddress:
        fulfilment === "delivery" && usingNewAddress
          ? { ...newAddress, phone: phone, saveForFuture: saveAddress }
          : undefined,
      shippingRateId: fulfilment === "delivery" ? (shippingRateId ?? undefined) : undefined,
      personalizedMessage: wantsMessage && giftMessage.recipientName.trim() && giftMessage.message.trim() ? giftMessage : undefined,
    });

    if (!result.ok) {
      setError(result.error);
      setStage("error");
      return;
    }

    setPlacedOrder({ orderNumber: result.order.orderNumber, total: result.order.total });
    // The server already cleared the persisted cart as part of order creation —
    // sync local state so the drawer/badge reflect that immediately.
    clearCart();

    // Order is real and persisted (PAYMENT_PENDING) regardless of what happens next —
    // this only decides how payment gets completed, never whether the order "succeeded".
    try {
      const mpesaResult = await initiateMpesaPayment({ phone, amount: result.order.total, orderRef: result.order.orderNumber });
      setMpesaMessage(mpesaResult.message);
    } catch {
      setMpesaMessage("Online M-Pesa payment isn't connected yet. Send us your order on WhatsApp and we'll confirm payment directly.");
    }
    setStage("awaiting-payment");
  }

  if (stage === "awaiting-payment" && placedOrder) {
    return (
      <div className="mx-auto max-w-lg border border-aurum-gold/40 bg-aurum-gold/10 p-8 text-center">
        <p className="font-display text-2xl">Order {placedOrder.orderNumber} placed.</p>
        <p className="mt-3 text-sm leading-relaxed text-aurum-obsidian/80">{mpesaMessage}</p>
        <a
          href={whatsappHref}
          target="_blank"
          rel="noreferrer"
          className="mt-6 inline-flex items-center bg-aurum-deep px-8 py-4 text-xs uppercase tracking-[0.2em] text-aurum-ivory transition-colors hover:bg-aurum-plum"
        >
          Complete Payment on WhatsApp
        </a>
        <div className="mt-6">
          <Link href={`/orders/${placedOrder.orderNumber}`} className="text-xs uppercase tracking-widest underline underline-offset-4">
            Track this order
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-16 lg:grid-cols-[1.2fr_1fr] lg:gap-24">
      <div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-8" noValidate>
          <div>
            <h2 className="mb-4 font-display text-2xl">Contact</h2>
            <input
              aria-label="Phone number"
              placeholder="Phone (for M-Pesa & delivery)"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={inputClasses}
            />
          </div>

          <div>
            <h2 className="mb-4 font-display text-2xl">Fulfilment</h2>
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
              <div className="mt-6 flex flex-col gap-6">
                {addresses.length > 0 && (
                  <div>
                    <p className="mb-3 text-xs uppercase tracking-widest text-aurum-obsidian/50">Delivery Address</p>
                    <div className="flex flex-col gap-2">
                      {addresses.map((a) => (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => {
                            setAddressId(a.id);
                            setUsingNewAddress(false);
                          }}
                          className={`border px-4 py-3 text-left text-sm ${
                            !usingNewAddress && addressId === a.id ? "border-aurum-obsidian" : "border-aurum-obsidian/20"
                          }`}
                        >
                          <span className="font-medium">{a.recipientName}</span> — {a.addressLine1}, {a.city}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setUsingNewAddress(true)}
                        className={`border px-4 py-3 text-left text-xs uppercase tracking-widest ${
                          usingNewAddress ? "border-aurum-obsidian" : "border-aurum-obsidian/20"
                        }`}
                      >
                        + Use a new address
                      </button>
                    </div>
                  </div>
                )}

                {usingNewAddress && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <input
                      aria-label="Recipient name"
                      placeholder="Recipient name"
                      value={newAddress.recipientName}
                      onChange={(e) => setNewAddress((a) => ({ ...a, recipientName: e.target.value }))}
                      className={`${inputClasses} sm:col-span-2`}
                    />
                    <input
                      aria-label="Address line 1"
                      placeholder="Street address"
                      value={newAddress.addressLine1}
                      onChange={(e) => setNewAddress((a) => ({ ...a, addressLine1: e.target.value }))}
                      className={`${inputClasses} sm:col-span-2`}
                    />
                    <input
                      aria-label="City"
                      placeholder="City"
                      value={newAddress.city}
                      onChange={(e) => setNewAddress((a) => ({ ...a, city: e.target.value }))}
                      className={inputClasses}
                    />
                    <input
                      aria-label="Region (optional)"
                      placeholder="Region (optional)"
                      value={newAddress.region}
                      onChange={(e) => setNewAddress((a) => ({ ...a, region: e.target.value }))}
                      className={inputClasses}
                    />
                    <label className="flex items-center gap-2 text-sm sm:col-span-2">
                      <input type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} />
                      Save this address to my account
                    </label>
                  </div>
                )}

                {shippingRates.length > 0 && (
                  <div>
                    <p className="mb-3 text-xs uppercase tracking-widest text-aurum-obsidian/50">Delivery Option</p>
                    <div className="flex flex-col gap-2">
                      {shippingRates.map((r) => (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => setShippingRateId(r.id)}
                          className={`flex items-center justify-between border px-4 py-3 text-sm ${
                            shippingRateId === r.id ? "border-aurum-obsidian" : "border-aurum-obsidian/20"
                          }`}
                        >
                          <span>
                            {r.zoneName} — {r.name}
                          </span>
                          <span>{formatKES(r.amount)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="mt-4 text-sm text-aurum-obsidian/60">
                Collect from our Kilimani, Nairobi studio once your order is marked Ready for Collection.
              </p>
            )}
          </div>

          <div>
            <button
              type="button"
              onClick={() => setWantsMessage((v) => !v)}
              className="text-xs uppercase tracking-widest text-aurum-obsidian/60 underline-offset-4 hover:underline"
            >
              {wantsMessage ? "Remove gift message" : "+ Add a gift message"}
            </button>
            {wantsMessage && (
              <div className="mt-4 grid gap-4">
                <input
                  aria-label="Message recipient name"
                  placeholder="Recipient's name"
                  value={giftMessage.recipientName}
                  onChange={(e) => setGiftMessage((m) => ({ ...m, recipientName: e.target.value }))}
                  className={inputClasses}
                />
                <textarea
                  aria-label="Gift message"
                  placeholder="Your message"
                  rows={3}
                  value={giftMessage.message}
                  onChange={(e) => setGiftMessage((m) => ({ ...m, message: e.target.value }))}
                  className={inputClasses}
                />
              </div>
            )}
          </div>

          <div>
            <h2 className="mb-4 font-display text-2xl">Payment</h2>
            <p className="text-sm text-aurum-obsidian/60">Pay securely with M-Pesa once you place your order.</p>
          </div>

          {error && <p className="text-sm text-aurum-earth">{error}</p>}

          <button
            type="submit"
            disabled={stage === "placing"}
            className="bg-aurum-deep px-8 py-4 text-xs uppercase tracking-[0.2em] text-aurum-ivory transition-colors hover:bg-aurum-plum disabled:opacity-60"
          >
            {stage === "placing" ? "Placing order…" : `Place Order — ${formatKES(total)}`}
          </button>
        </form>
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
        <div className="mt-6 flex flex-col gap-2 border-t border-[var(--border-subtle)] pt-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-aurum-obsidian/60">Subtotal</span>
            <span>{formatKES(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-aurum-obsidian/60">Shipping</span>
            <span>{fulfilment === "collection" ? "Free" : formatKES(shippingTotal)}</span>
          </div>
          <div className="flex items-center justify-between border-t border-[var(--border-subtle)] pt-2 font-display text-lg">
            <span>Total</span>
            <span>{formatKES(total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
