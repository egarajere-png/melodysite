"use client";

import { FormEvent, useRef, useState } from "react";
import Link from "next/link";
import { Check, MapPin, Search, Store, Truck } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { EditorialImage } from "@/components/ui/EditorialImage";
import { formatKES } from "@/lib/format";
import { initiateMpesaPayment } from "@/lib/payments/mpesa";
import { createOrderAction } from "@/app/actions/checkout";
import { isPlausibleEmail, isPlausiblePhone } from "@/lib/delivery";
import type { DeliveryOptions } from "@/lib/supabase/shipping";
import type { CheckoutPrefill } from "@/lib/supabase/orders";

const inputClasses =
  "w-full border-b border-aurum-obsidian/25 bg-transparent py-3 text-sm placeholder:text-aurum-obsidian/40 focus-visible:border-aurum-obsidian focus-visible:outline-none aria-[invalid=true]:border-aurum-earth";
const fieldLabel = "block text-[11px] uppercase tracking-widest text-aurum-obsidian/50";

type Stage = "form" | "placing" | "awaiting-payment";
type FieldErrors = Partial<Record<"name" | "email" | "phone" | "group" | "area" | "location" | "recipientName" | "recipientPhone" | "pickup", string>>;

function rangeLabel(min: number, max: number) {
  return min === max ? formatKES(min) : `${formatKES(min)} – ${formatKES(max)}`;
}

/** A selectable card with an unmistakable selected state (dark border, tint, tick). */
function ChoiceCard({
  selected,
  onSelect,
  children,
  className = "",
}: {
  selected: boolean;
  onSelect: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={`relative w-full border text-left transition-all ${
        selected ? "border-aurum-obsidian bg-white shadow-[0_0_0_1px_var(--color-aurum-obsidian)]" : "border-aurum-obsidian/20 hover:border-aurum-obsidian/50"
      } ${className}`}
    >
      <span
        aria-hidden
        className={`absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full border transition-colors ${
          selected ? "border-aurum-obsidian bg-aurum-obsidian text-aurum-ivory" : "border-aurum-obsidian/25"
        }`}
      >
        {selected && <Check size={12} strokeWidth={2.5} />}
      </span>
      {children}
    </button>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1.5 text-xs text-aurum-earth">
      {message}
    </p>
  );
}

export function CheckoutClient({
  options,
  prefill,
  customerName,
  customerEmail,
}: {
  options: DeliveryOptions;
  prefill: CheckoutPrefill;
  customerName: string;
  customerEmail: string;
}) {
  const { lines, subtotal, clearCart } = useCart();
  const { groups, pickupLocations } = options;
  const errorRef = useRef<HTMLParagraphElement>(null);

  // Pre-select the area from the customer's last order if it's still offered.
  const prefillGroup = groups.find((g) => g.areas.some((a) => a.id === prefill.areaId));
  const canDeliver = groups.length > 0;
  const canPickup = pickupLocations.length > 0;

  const [fullName, setFullName] = useState(prefill.contactName ?? customerName);
  const [email, setEmail] = useState(prefill.contactEmail ?? customerEmail);
  const [phone, setPhone] = useState(prefill.contactPhone ?? "");
  const [fulfilment, setFulfilment] = useState<"delivery" | "collection">(
    prefill.fulfilment === "collection" && canPickup ? "collection" : canDeliver ? "delivery" : "collection"
  );
  const [groupId, setGroupId] = useState<string | null>(prefillGroup?.id ?? (groups.length === 1 ? groups[0].id : null));
  const [areaId, setAreaId] = useState<string | null>(prefillGroup ? prefill.areaId : null);
  const [areaQuery, setAreaQuery] = useState("");
  const [location, setLocation] = useState(prefillGroup ? (prefill.delivery?.location ?? "") : "");
  const [addressDetails, setAddressDetails] = useState(prefillGroup ? (prefill.delivery?.address_details ?? "") : "");
  const [instructions, setInstructions] = useState("");
  const [forSomeoneElse, setForSomeoneElse] = useState(false);
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [pickupId, setPickupId] = useState<string | null>(pickupLocations.length === 1 ? pickupLocations[0].id : null);
  const [wantsMessage, setWantsMessage] = useState(false);
  const [giftMessage, setGiftMessage] = useState({ recipientName: "", message: "" });

  const [stage, setStage] = useState<Stage>("form");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [placedOrder, setPlacedOrder] = useState<{ orderNumber: string; total: number; accessToken: string } | null>(null);
  const [mpesaMessage, setMpesaMessage] = useState<string | null>(null);

  const group = groups.find((g) => g.id === groupId) ?? null;
  const area = group?.areas.find((a) => a.id === areaId) ?? null;
  const pickup = pickupLocations.find((p) => p.id === pickupId) ?? null;
  const shippingTotal = fulfilment === "delivery" ? (area?.amount ?? 0) : 0;
  const total = subtotal + shippingTotal;
  const cheapestDelivery = canDeliver ? Math.min(...groups.map((g) => g.minAmount)) : 0;

  const areaFilter = areaQuery.trim().toLowerCase();
  const visibleAreas = !group ? [] : areaFilter ? group.areas.filter((a) => a.name.toLowerCase().includes(areaFilter)) : group.areas;

  function whatsappHref() {
    if (!placedOrder) return "#";
    const itemLines = lines.map((l) => `• ${l.name} (${l.variantLabel}) x${l.quantity} — ${formatKES(l.unitPrice * l.quantity)}`);
    const where = fulfilment === "delivery" && group && area ? `Delivery: ${group.name} — ${area.name}, ${location}` : `Pickup: ${pickup?.name ?? ""}`;
    const text = [`Order ${placedOrder.orderNumber}`, `Phone: ${phone}`, where, "", ...itemLines, "", `Total: ${formatKES(placedOrder.total)}`].join("\n");
    return `https://wa.me/254700000000?text=${encodeURIComponent(text)}`;
  }

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

  /** Drop a field's error as soon as the buyer fixes it (and the banner once none remain). */
  function clearError(key: keyof FieldErrors) {
    if (!errors[key]) return;
    const next = { ...errors, [key]: undefined };
    setErrors(next);
    if (!Object.values(next).some(Boolean)) setFormError(null);
  }

  function chooseGroup(id: string) {
    if (id === groupId) return;
    setGroupId(id);
    setAreaId(null);
    setAreaQuery("");
    clearError("group");
  }

  function validate(): FieldErrors {
    const next: FieldErrors = {};
    if (!fullName.trim()) next.name = "Enter your full name.";
    if (!isPlausibleEmail(email)) next.email = "Enter a valid email — your order updates go here.";
    if (!isPlausiblePhone(phone)) next.phone = "Enter a valid phone number, e.g. 0712 345 678.";
    if (fulfilment === "delivery") {
      if (!group) next.group = "Choose where we're delivering to.";
      else if (!area) next.area = `Choose your area in ${group.name}.`;
      if (!location.trim()) next.location = "Tell us the exact place or a nearby landmark.";
      if (forSomeoneElse) {
        if (!recipientName.trim()) next.recipientName = "Enter the recipient's name.";
        if (!isPlausiblePhone(recipientPhone)) next.recipientPhone = "Enter the recipient's phone number.";
      }
    } else if (!pickup) {
      next.pickup = "Choose a pickup point.";
    }
    return next;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length) {
      setFormError("Please check the highlighted details.");
      requestAnimationFrame(() => document.querySelector<HTMLElement>("[aria-invalid='true'], [data-error='true']")?.scrollIntoView({ behavior: "smooth", block: "center" }));
      return;
    }
    setFormError(null);
    setStage("placing");

    const result = await createOrderAction({
      contactName: fullName,
      contactEmail: email,
      contactPhone: phone,
      fulfilment,
      delivery:
        fulfilment === "delivery" && area
          ? {
              areaId: area.id,
              location,
              addressDetails,
              instructions,
              recipientName: forSomeoneElse ? recipientName : fullName,
              recipientPhone: forSomeoneElse ? recipientPhone : phone,
            }
          : undefined,
      pickupLocationId: fulfilment === "collection" ? (pickup?.id ?? undefined) : undefined,
      personalizedMessage: wantsMessage && giftMessage.recipientName.trim() && giftMessage.message.trim() ? giftMessage : undefined,
    });

    if (!result.ok) {
      setFormError(result.error);
      setStage("form");
      requestAnimationFrame(() => errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }));
      return;
    }

    setPlacedOrder({ orderNumber: result.order.orderNumber, total: result.order.total, accessToken: result.order.accessToken });
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
          href={whatsappHref()}
          target="_blank"
          rel="noreferrer"
          className="mt-6 inline-flex items-center bg-aurum-deep px-8 py-4 text-xs uppercase tracking-[0.2em] text-aurum-ivory transition-colors hover:bg-aurum-plum"
        >
          Complete Payment on WhatsApp
        </a>
        <div className="mt-6">
          <Link href={`/orders/${placedOrder.orderNumber}?t=${placedOrder.accessToken}`} className="text-xs uppercase tracking-widest underline underline-offset-4">
            Track this order
          </Link>
        </div>
      </div>
    );
  }

  const selectionSummary =
    fulfilment === "delivery"
      ? group && area
        ? `Delivery to ${group.name} — ${area.name} · ${formatKES(area.amount)}`
        : null
      : pickup
        ? `Pickup from ${pickup.name} · Free`
        : null;

  return (
    <div className="grid gap-16 lg:grid-cols-[1.2fr_1fr] lg:gap-24">
      <div className="min-w-0">
        <form onSubmit={handleSubmit} className="flex flex-col gap-12" noValidate>
          {/* 1. Contact */}
          <section>
            <h2 className="mb-1 font-display text-2xl">1. Contact</h2>
            <p className="mb-5 text-sm text-aurum-obsidian/55">We&apos;ll send your order confirmation and delivery updates here.</p>
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="co-name" className={fieldLabel}>Full name</label>
                <input id="co-name" autoComplete="name" value={fullName} onChange={(e) => { setFullName(e.target.value); clearError("name"); }} aria-invalid={Boolean(errors.name)} aria-describedby="co-name-err" className={inputClasses} />
                <FieldError id="co-name-err" message={errors.name} />
              </div>
              <div>
                <label htmlFor="co-email" className={fieldLabel}>Email</label>
                <input id="co-email" type="email" autoComplete="email" value={email} onChange={(e) => { setEmail(e.target.value); clearError("email"); }} aria-invalid={Boolean(errors.email)} aria-describedby="co-email-err" className={inputClasses} />
                <FieldError id="co-email-err" message={errors.email} />
              </div>
              <div>
                <label htmlFor="co-phone" className={fieldLabel}>Phone (M-Pesa)</label>
                <input id="co-phone" type="tel" autoComplete="tel" placeholder="e.g. 0712 345 678" value={phone} onChange={(e) => { setPhone(e.target.value); clearError("phone"); }} aria-invalid={Boolean(errors.phone)} aria-describedby="co-phone-err" className={inputClasses} />
                <FieldError id="co-phone-err" message={errors.phone} />
              </div>
            </div>
          </section>

          {/* 2. Delivery or pickup */}
          <section>
            <h2 className="mb-5 font-display text-2xl">2. Delivery or pickup</h2>
            <div role="radiogroup" aria-label="Delivery or pickup" className="grid gap-3 sm:grid-cols-2">
              {canDeliver && (
                <ChoiceCard selected={fulfilment === "delivery"} onSelect={() => setFulfilment("delivery")} className="p-5 pr-10">
                  <Truck size={20} strokeWidth={1.5} className="mb-3 text-aurum-obsidian/60" />
                  <p className="text-sm font-medium uppercase tracking-widest">Delivery</p>
                  <p className="mt-1 text-sm text-aurum-obsidian/60">From {formatKES(cheapestDelivery)}, based on your area</p>
                </ChoiceCard>
              )}
              {canPickup && (
                <ChoiceCard selected={fulfilment === "collection"} onSelect={() => setFulfilment("collection")} className="p-5 pr-10">
                  <Store size={20} strokeWidth={1.5} className="mb-3 text-aurum-obsidian/60" />
                  <p className="text-sm font-medium uppercase tracking-widest">Pickup · Free</p>
                  <p className="mt-1 text-sm text-aurum-obsidian/60">{pickupLocations.length === 1 ? `Collect from ${pickupLocations[0].name}` : "Collect from one of our pickup points"}</p>
                </ChoiceCard>
              )}
            </div>

            {fulfilment === "delivery" ? (
              <div className="mt-8 flex flex-col gap-8">
                {/* Group */}
                <div data-error={Boolean(errors.group)}>
                  <p className={`${fieldLabel} mb-3`}>Where are we delivering?</p>
                  <div role="radiogroup" aria-label="Delivery region" className="grid gap-3 sm:grid-cols-2">
                    {groups.map((g) => (
                      <ChoiceCard key={g.id} selected={groupId === g.id} onSelect={() => chooseGroup(g.id)} className="px-4 py-3.5 pr-10">
                        <p className="font-display text-lg leading-tight">{g.name}</p>
                        {g.description && <p className="mt-0.5 text-xs text-aurum-obsidian/55">{g.description}</p>}
                        <p className="mt-1.5 text-xs uppercase tracking-widest text-aurum-obsidian/60">{rangeLabel(g.minAmount, g.maxAmount)}</p>
                      </ChoiceCard>
                    ))}
                  </div>
                  <FieldError id="co-group-err" message={errors.group} />
                </div>

                {/* Area */}
                {group && (
                  <div data-error={Boolean(errors.area)}>
                    <p className={`${fieldLabel} mb-3`}>Your area in {group.name}</p>
                    {group.areas.length > 8 && (
                      <div className="mb-3 flex items-center gap-2 border-b border-aurum-obsidian/25 py-2">
                        <Search size={15} strokeWidth={1.5} className="text-aurum-obsidian/40" />
                        <input value={areaQuery} onChange={(e) => setAreaQuery(e.target.value)} placeholder={`Search areas in ${group.name}…`} aria-label={`Search areas in ${group.name}`} className="w-full bg-transparent text-sm focus-visible:outline-none" />
                      </div>
                    )}
                    <div role="radiogroup" aria-label={`Area in ${group.name}`} className="flex max-h-80 flex-col gap-2 overflow-y-auto pr-1">
                      {visibleAreas.map((a) => (
                        <ChoiceCard key={a.id} selected={areaId === a.id} onSelect={() => { setAreaId(a.id); clearError("area"); }} className="flex items-center justify-between gap-4 py-3 pl-4 pr-12">
                          <span className="min-w-0">
                            <span className="block text-sm">{a.name}</span>
                            {a.deliveryEstimate && <span className="block text-xs text-aurum-obsidian/50">{a.deliveryEstimate}</span>}
                          </span>
                          <span className="shrink-0 text-sm font-medium">{formatKES(a.amount)}</span>
                        </ChoiceCard>
                      ))}
                      {visibleAreas.length === 0 && <p className="py-3 text-sm text-aurum-obsidian/50">No areas match &ldquo;{areaQuery}&rdquo;.</p>}
                    </div>
                    <FieldError id="co-area-err" message={errors.area} />
                  </div>
                )}

                {/* Exact location */}
                {area && (
                  <div className="flex flex-col gap-6">
                    <div>
                      <label htmlFor="co-location" className={fieldLabel}>Exact location or landmark</label>
                      <input
                        id="co-location"
                        value={location}
                        onChange={(e) => { setLocation(e.target.value); clearError("location"); }}
                        placeholder={`e.g. Madaraka Primary School, ${area.name}`}
                        aria-invalid={Boolean(errors.location)}
                        aria-describedby="co-location-err"
                        className={inputClasses}
                      />
                      <FieldError id="co-location-err" message={errors.location} />
                    </div>
                    <div className="grid gap-6 sm:grid-cols-2">
                      <div>
                        <label htmlFor="co-address" className={fieldLabel}>Building, house or street (optional)</label>
                        <input id="co-address" value={addressDetails} onChange={(e) => setAddressDetails(e.target.value)} placeholder="e.g. Block C, House 12" className={inputClasses} />
                      </div>
                      <div>
                        <label htmlFor="co-instructions" className={fieldLabel}>Delivery instructions (optional)</label>
                        <input id="co-instructions" value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="e.g. Call when at the gate" className={inputClasses} />
                      </div>
                    </div>
                    <label className="flex w-fit cursor-pointer items-center gap-2 text-sm">
                      <input type="checkbox" checked={forSomeoneElse} onChange={(e) => setForSomeoneElse(e.target.checked)} className="accent-aurum-deep" />
                      Someone else will receive this order
                    </label>
                    {forSomeoneElse && (
                      <div className="grid gap-6 sm:grid-cols-2">
                        <div>
                          <label htmlFor="co-rname" className={fieldLabel}>Recipient&apos;s name</label>
                          <input id="co-rname" value={recipientName} onChange={(e) => { setRecipientName(e.target.value); clearError("recipientName"); }} aria-invalid={Boolean(errors.recipientName)} aria-describedby="co-rname-err" className={inputClasses} />
                          <FieldError id="co-rname-err" message={errors.recipientName} />
                        </div>
                        <div>
                          <label htmlFor="co-rphone" className={fieldLabel}>Recipient&apos;s phone</label>
                          <input id="co-rphone" type="tel" value={recipientPhone} onChange={(e) => { setRecipientPhone(e.target.value); clearError("recipientPhone"); }} aria-invalid={Boolean(errors.recipientPhone)} aria-describedby="co-rphone-err" className={inputClasses} />
                          <FieldError id="co-rphone-err" message={errors.recipientPhone} />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-8" data-error={Boolean(errors.pickup)}>
                <p className={`${fieldLabel} mb-3`}>Pickup point</p>
                <div role="radiogroup" aria-label="Pickup point" className="flex flex-col gap-2">
                  {pickupLocations.map((p) => (
                    <ChoiceCard key={p.id} selected={pickupId === p.id} onSelect={() => { setPickupId(p.id); clearError("pickup"); }} className="flex gap-3 py-4 pl-4 pr-12">
                      <MapPin size={16} strokeWidth={1.5} className="mt-0.5 shrink-0 text-aurum-obsidian/50" />
                      <span>
                        <span className="block text-sm font-medium">{p.name}</span>
                        <span className="block text-sm text-aurum-obsidian/60">{p.address}</span>
                        {p.hours && <span className="mt-1 block text-xs text-aurum-obsidian/50">{p.hours}</span>}
                        {p.directions && <span className="block text-xs text-aurum-obsidian/50">{p.directions}</span>}
                      </span>
                    </ChoiceCard>
                  ))}
                </div>
                <FieldError id="co-pickup-err" message={errors.pickup} />
                <p className="mt-3 text-sm text-aurum-obsidian/55">We&apos;ll email you when your order is ready to collect. No delivery fee.</p>
              </div>
            )}

            {selectionSummary && (
              <p role="status" className="mt-6 flex items-center gap-2 bg-aurum-obsidian px-4 py-3 text-xs uppercase tracking-widest text-aurum-ivory">
                <Check size={14} strokeWidth={2} className="shrink-0 text-aurum-gold" />
                {selectionSummary}
              </p>
            )}
          </section>

          {/* 3. Gift message */}
          <section>
            <button type="button" onClick={() => setWantsMessage((v) => !v)} className="text-xs uppercase tracking-widest text-aurum-obsidian/60 underline-offset-4 hover:underline">
              {wantsMessage ? "Remove gift message" : "+ Add a gift message"}
            </button>
            {wantsMessage && (
              <div className="mt-4 grid gap-4">
                <input aria-label="Message recipient name" placeholder="Recipient's name" value={giftMessage.recipientName} onChange={(e) => setGiftMessage((m) => ({ ...m, recipientName: e.target.value }))} className={inputClasses} />
                <textarea aria-label="Gift message" placeholder="Your message" rows={3} value={giftMessage.message} onChange={(e) => setGiftMessage((m) => ({ ...m, message: e.target.value }))} className={inputClasses} />
              </div>
            )}
          </section>

          {/* 4. Payment */}
          <section>
            <h2 className="mb-2 font-display text-2xl">3. Payment</h2>
            <p className="text-sm text-aurum-obsidian/60">Pay with M-Pesa once you place your order.</p>
          </section>

          {formError && (
            <p ref={errorRef} role="alert" className="border-l-2 border-aurum-earth bg-white px-4 py-3 text-sm text-aurum-earth">
              {formError}
            </p>
          )}

          <button
            type="submit"
            disabled={stage === "placing"}
            className="bg-aurum-deep px-8 py-4 text-xs uppercase tracking-[0.2em] text-aurum-ivory transition-colors hover:bg-aurum-plum disabled:opacity-60"
          >
            {stage === "placing" ? "Placing order…" : `Place Order — ${formatKES(total)}`}
          </button>
        </form>
      </div>

      <div className="h-fit border border-[var(--border-subtle)] p-6 lg:sticky lg:top-28">
        <h2 className="mb-6 font-display text-xl">Order Summary</h2>
        <ul className="flex flex-col gap-4">
          {lines.map((line) => (
            <li key={line.variantId} className="flex gap-4">
              <EditorialImage image={line.image} className="h-16 w-14 shrink-0" sizes="56px" />
              <div className="flex min-w-0 flex-1 items-start justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <p>{line.name}</p>
                  <p className="text-xs text-aurum-obsidian/50">
                    {line.variantLabel} · Qty {line.quantity}
                  </p>
                </div>
                <p className="shrink-0">{formatKES(line.unitPrice * line.quantity)}</p>
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-6 flex flex-col gap-2 border-t border-[var(--border-subtle)] pt-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-aurum-obsidian/60">Subtotal</span>
            <span>{formatKES(subtotal)}</span>
          </div>
          <div className="flex items-start justify-between gap-4">
            <span className="text-aurum-obsidian/60">
              {fulfilment === "collection" ? "Pickup" : "Delivery"}
              {fulfilment === "delivery" && group && area && <span className="block text-xs text-aurum-obsidian/45">{group.name} — {area.name}</span>}
              {fulfilment === "collection" && pickup && <span className="block text-xs text-aurum-obsidian/45">{pickup.name}</span>}
            </span>
            <span className="shrink-0">{fulfilment === "collection" ? "Free" : area ? formatKES(shippingTotal) : "Choose area"}</span>
          </div>
          <div className="flex items-center justify-between border-t border-[var(--border-subtle)] pt-2 font-display text-lg">
            <span>Total</span>
            <span>{formatKES(total)}</span>
          </div>
        </div>
        {fulfilment === "delivery" && area && location.trim() && (
          <p className="mt-4 flex gap-2 border-t border-[var(--border-subtle)] pt-4 text-xs text-aurum-obsidian/60">
            <MapPin size={14} strokeWidth={1.5} className="shrink-0" />
            <span>
              Delivering to {location.trim()}, {area.name}, {group?.name}
            </span>
          </p>
        )}
      </div>
    </div>
  );
}
