"use client";

import { FormEvent, useRef, useState } from "react";
import Link from "next/link";
import { Check, Clock, CreditCard, MapPin, Package, Search, Smartphone, Store } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { EditorialImage } from "@/components/ui/EditorialImage";
import { formatKES } from "@/lib/format";
import { toMpesaMsisdn } from "@/lib/payments/phone";
import { createOrderAction } from "@/app/actions/checkout";
import { startMpesaPaymentAction } from "@/app/actions/payments";
import { MpesaPayment } from "@/components/checkout/MpesaPayment";
import { isPlausibleEmail, isPlausiblePhone } from "@/lib/delivery";
import type { DeliveryArea, DeliveryGroup, DeliveryOptions } from "@/lib/supabase/shipping";
import type { CheckoutPrefill } from "@/lib/supabase/orders";
import type { MpesaPaymentView } from "@/lib/supabase/payments";

const inputClasses =
  "w-full border-b border-aurum-obsidian/25 bg-transparent py-3 text-sm placeholder:text-aurum-obsidian/40 focus-visible:border-aurum-obsidian focus-visible:outline-none aria-[invalid=true]:border-aurum-earth";
const fieldLabel = "block text-[11px] uppercase tracking-widest text-aurum-obsidian/50";

type Stage = "form" | "placing" | "awaiting-payment";
type FieldErrors = Partial<Record<"name" | "email" | "phone" | "group" | "area" | "location" | "recipientName" | "recipientPhone" | "pickup" | "mpesaPhone", string>>;

/** An agent matches a search on its name, its address or its location's name. */
function matchesQuery(group: DeliveryGroup, area: DeliveryArea, query: string) {
  return [group.name, group.description, area.name, area.agentLocation].some((v) => v?.toLowerCase().includes(query));
}

/** A selectable card with an unmistakable selected state (dark border, tint, tick). */
function ChoiceCard({
  selected,
  onSelect,
  children,
  className = "",
  disabled = false,
}: {
  selected: boolean;
  onSelect: () => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={onSelect}
      className={`relative w-full border text-left transition-all ${
        selected
          ? "border-aurum-obsidian bg-white shadow-[0_0_0_1px_var(--color-aurum-obsidian)]"
          : disabled
            ? "cursor-not-allowed border-aurum-obsidian/15 opacity-55"
            : "border-aurum-obsidian/20 hover:border-aurum-obsidian/50"
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
  // Only typed for a town outside Nairobi; a Nairobi agent is itself the collection point.
  const [location, setLocation] = useState(prefillGroup?.asksCustomerLocation ? (prefill.delivery?.location ?? "") : "");
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
  // Null until the buyer edits it — until then it follows the contact phone.
  const [mpesaPhoneEdit, setMpesaPhoneEdit] = useState<string | null>(null);
  const [payment, setPayment] = useState<MpesaPaymentView | null>(null);

  const group = groups.find((g) => g.id === groupId) ?? null;
  const area = group?.areas.find((a) => a.id === areaId) ?? null;
  const pickup = pickupLocations.find((p) => p.id === pickupId) ?? null;
  const shippingTotal = fulfilment === "delivery" ? (area?.amount ?? 0) : 0;
  const total = subtotal + shippingTotal;
  const mpesaPhone = mpesaPhoneEdit ?? phone;
  const cheapestDelivery = canDeliver ? Math.min(...groups.map((g) => g.minAmount)) : 0;

  const needsLocation = Boolean(group && area && (group.asksCustomerLocation || !area.agentLocation));
  // Searching looks across every location at once; otherwise the chosen location's agents.
  const areaFilter = areaQuery.trim().toLowerCase();
  const searchResults = areaFilter
    ? groups.flatMap((g) => g.areas.filter((a) => matchesQuery(g, a, areaFilter)).map((a) => ({ group: g, area: a })))
    : [];

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

  /** Drop fields' errors as soon as the buyer fixes them (and the banner once none remain).
   * Takes several keys so one choice can clear them together — separate calls in the
   * same event would each start from the same stale `errors` and undo one another. */
  function clearError(...keys: (keyof FieldErrors)[]) {
    if (!keys.some((key) => errors[key])) return;
    const next = { ...errors };
    for (const key of keys) next[key] = undefined;
    setErrors(next);
    if (!Object.values(next).some(Boolean)) setFormError(null);
  }

  function chooseGroup(id: string) {
    if (id === groupId) return;
    setGroupId(id);
    setAreaId(null);
    setLocation("");
    clearError("group", "area", "location");
  }

  function chooseArea(g: DeliveryGroup, a: DeliveryArea) {
    if (g.id !== groupId) setLocation("");
    setGroupId(g.id);
    setAreaId(a.id);
    setAreaQuery("");
    // A different agent may not need a typed location, so its old error goes too.
    clearError("group", "area", "location");
  }

  function validate(): FieldErrors {
    const next: FieldErrors = {};
    if (!fullName.trim()) next.name = "Enter your full name.";
    if (!isPlausibleEmail(email)) next.email = "Enter a valid email — your order updates go here.";
    if (!isPlausiblePhone(phone)) next.phone = "Enter a valid phone number, e.g. 0712 345 678.";
    if (fulfilment === "delivery") {
      if (!group) next.group = "Choose the Pick Up Mtaani agent nearest you.";
      else if (!area) next.area = group.asksCustomerLocation ? "Choose your town." : `Choose an agent in ${group.name}.`;
      if (needsLocation && !location.trim()) next.location = `Tell us where in ${area?.name ?? "town"} you'd like to collect.`;
      if (forSomeoneElse) {
        if (!recipientName.trim()) next.recipientName = "Enter the name of the person collecting.";
        if (!isPlausiblePhone(recipientPhone)) next.recipientPhone = "Enter their phone number.";
      }
    } else if (!pickup) {
      next.pickup = "Choose a pickup point.";
    }
    if (!toMpesaMsisdn(mpesaPhone)) next.mpesaPhone = "Enter the Safaricom number you'll pay from, e.g. 0712 345 678.";
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
              location: needsLocation ? location : undefined,
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
    // this only sends the M-Pesa prompt. Whether it was paid is decided on the server.
    const started = await startMpesaPaymentAction(result.order.orderNumber, result.order.accessToken, mpesaPhone).catch(() => null);
    setPayment(started ?? { state: "failed", message: "We couldn't send the M-Pesa request. Try again below.", receipt: null });
    setStage("awaiting-payment");
  }

  if (stage === "awaiting-payment" && placedOrder && payment) {
    return (
      <div className="mx-auto max-w-lg">
        <p className="mb-6 text-center font-display text-2xl">Order {placedOrder.orderNumber} placed.</p>
        <MpesaPayment orderNumber={placedOrder.orderNumber} accessToken={placedOrder.accessToken} total={placedOrder.total} defaultPhone={mpesaPhone} initial={payment} />
        <p className="mt-6 text-center">
          <Link href={`/orders/${placedOrder.orderNumber}?t=${placedOrder.accessToken}`} className="text-xs uppercase tracking-widest underline underline-offset-4">
            View this order
          </Link>
        </p>
      </div>
    );
  }

  const selectionSummary =
    fulfilment === "delivery"
      ? group && area
        ? `Pick Up Mtaani · ${area.name}, ${group.name} · ${formatKES(area.amount)}`
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
            <p className="mb-5 text-sm text-aurum-obsidian/55">We&apos;ll send your order confirmation, tracking code and delivery updates by email and WhatsApp.</p>
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
                <label htmlFor="co-phone" className={fieldLabel}>Phone</label>
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
                  <Package size={20} strokeWidth={1.5} className="mb-3 text-aurum-obsidian/60" />
                  <p className="text-sm font-medium uppercase tracking-widest">Pick Up Mtaani</p>
                  <p className="mt-1 text-sm text-aurum-obsidian/60">Collect from an agent near you · from {formatKES(cheapestDelivery)}</p>
                </ChoiceCard>
              )}
              {canPickup && (
                <ChoiceCard selected={fulfilment === "collection"} onSelect={() => setFulfilment("collection")} className="p-5 pr-10">
                  <Store size={20} strokeWidth={1.5} className="mb-3 text-aurum-obsidian/60" />
                  <p className="text-sm font-medium uppercase tracking-widest">Shop pickup · Free</p>
                  <p className="mt-1 text-sm text-aurum-obsidian/60">{pickupLocations.length === 1 ? `Collect from ${pickupLocations[0].name}` : "Collect from one of our pickup points"}</p>
                </ChoiceCard>
              )}
            </div>

            {fulfilment === "delivery" ? (
              <div className="mt-8 flex flex-col gap-8">
                <p className="text-sm text-aurum-obsidian/60">
                  We send your order through <strong className="font-medium text-aurum-obsidian">Pick Up Mtaani</strong>. Choose the agent nearest you — we&apos;ll book the parcel, send you its tracking code, and Pick Up Mtaani will SMS you when it&apos;s on its way.
                </p>

                {/* Agent: search across every location, or browse one location */}
                <div data-error={Boolean(errors.group || errors.area)}>
                  <p className={`${fieldLabel} mb-3`}>Find your nearest agent</p>
                  <div className="mb-4 flex items-center gap-2 border-b border-aurum-obsidian/25 py-2">
                    <Search size={15} strokeWidth={1.5} className="text-aurum-obsidian/40" />
                    <input
                      value={areaQuery}
                      onChange={(e) => setAreaQuery(e.target.value)}
                      placeholder="Search your area or estate, e.g. Kahawa, Westlands, Rongai"
                      aria-label="Search Pick Up Mtaani agents"
                      className="w-full bg-transparent text-sm focus-visible:outline-none"
                    />
                  </div>

                  {areaFilter ? (
                    <div role="radiogroup" aria-label="Matching agents" className="flex max-h-96 flex-col gap-2 overflow-y-auto pr-1">
                      {searchResults.map(({ group: g, area: a }) => (
                        <AgentCard key={a.id} group={g} area={a} showGroup selected={areaId === a.id} onSelect={() => chooseArea(g, a)} />
                      ))}
                      {searchResults.length === 0 && (
                        <p className="py-3 text-sm text-aurum-obsidian/50">
                          No agents match &ldquo;{areaQuery}&rdquo;. Try a nearby estate, or choose &ldquo;Outside Nairobi&rdquo; below.
                        </p>
                      )}
                    </div>
                  ) : (
                    <>
                      <div role="radiogroup" aria-label="Pick Up Mtaani location" className="flex flex-wrap gap-2">
                        {groups.map((g) => (
                          <button
                            key={g.id}
                            type="button"
                            role="radio"
                            aria-checked={groupId === g.id}
                            onClick={() => chooseGroup(g.id)}
                            className={`border px-3 py-2 text-xs uppercase tracking-widest transition-colors ${
                              groupId === g.id ? "border-aurum-obsidian bg-aurum-obsidian text-aurum-ivory" : "border-aurum-obsidian/20 hover:border-aurum-obsidian/50"
                            }`}
                          >
                            {g.name}
                          </button>
                        ))}
                      </div>
                      {group && (
                        <div className="mt-5">
                          <p className={`${fieldLabel} mb-3`}>{group.asksCustomerLocation ? "Your town" : `Agents in ${group.name}`}</p>
                          <div role="radiogroup" aria-label={`Agents in ${group.name}`} className="flex max-h-96 flex-col gap-2 overflow-y-auto pr-1">
                            {group.areas.map((a) => (
                              <AgentCard key={a.id} group={group} area={a} selected={areaId === a.id} onSelect={() => chooseArea(group, a)} />
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                  <FieldError id="co-group-err" message={errors.group ?? errors.area} />
                </div>

                {area && (
                  <div className="flex flex-col gap-6">
                    {needsLocation && (
                      <div>
                        <label htmlFor="co-location" className={fieldLabel}>
                          {area.agentLocation ? `Where in ${area.name} would you like to collect?` : "Your town, and where you'd like to collect"}
                        </label>
                        <input
                          id="co-location"
                          value={location}
                          onChange={(e) => { setLocation(e.target.value); clearError("location"); }}
                          placeholder={area.name === "Other town" ? "e.g. Eldoret — Pick Up Mtaani agent near the stage" : `e.g. ${area.name} town centre, or a Pick Up Mtaani agent you know`}
                          aria-invalid={Boolean(errors.location)}
                          aria-describedby="co-location-err"
                          className={inputClasses}
                        />
                        <FieldError id="co-location-err" message={errors.location} />
                        <p className="mt-2 text-xs text-aurum-obsidian/50">We&apos;ll confirm the exact collection point with you on WhatsApp before sending.</p>
                      </div>
                    )}
                    <label className="flex w-fit cursor-pointer items-center gap-2 text-sm">
                      <input type="checkbox" checked={forSomeoneElse} onChange={(e) => setForSomeoneElse(e.target.checked)} className="accent-aurum-deep" />
                      Someone else will collect this order
                    </label>
                    {forSomeoneElse && (
                      <div className="grid gap-6 sm:grid-cols-2">
                        <div>
                          <label htmlFor="co-rname" className={fieldLabel}>Their full name</label>
                          <input id="co-rname" value={recipientName} onChange={(e) => { setRecipientName(e.target.value); clearError("recipientName"); }} aria-invalid={Boolean(errors.recipientName)} aria-describedby="co-rname-err" className={inputClasses} />
                          <FieldError id="co-rname-err" message={errors.recipientName} />
                        </div>
                        <div>
                          <label htmlFor="co-rphone" className={fieldLabel}>Their phone</label>
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
            <h2 className="mb-5 font-display text-2xl">3. Payment</h2>
            <div role="radiogroup" aria-label="Payment method" className="grid gap-3 sm:grid-cols-2">
              <ChoiceCard selected onSelect={() => {}} className="p-5 pr-10">
                <Smartphone size={20} strokeWidth={1.5} className="mb-3 text-aurum-obsidian/60" />
                <p className="text-sm font-medium uppercase tracking-widest">M-Pesa</p>
                <p className="mt-1 text-sm text-aurum-obsidian/60">Pay from your phone with your M-Pesa PIN</p>
              </ChoiceCard>
              <ChoiceCard selected={false} disabled onSelect={() => {}} className="p-5 pr-10">
                <CreditCard size={20} strokeWidth={1.5} className="mb-3 text-aurum-obsidian/60" />
                <p className="text-sm font-medium uppercase tracking-widest">Card</p>
                <p className="mt-1 text-sm text-aurum-obsidian/60">Visa &amp; Mastercard — coming soon</p>
              </ChoiceCard>
            </div>
            <div className="mt-8">
              <label htmlFor="co-mpesa" className={fieldLabel}>M-Pesa number to pay from</label>
              <input
                id="co-mpesa"
                type="tel"
                autoComplete="tel"
                placeholder="e.g. 0712 345 678"
                value={mpesaPhone}
                onChange={(e) => { setMpesaPhoneEdit(e.target.value); clearError("mpesaPhone"); }}
                aria-invalid={Boolean(errors.mpesaPhone)}
                aria-describedby="co-mpesa-err"
                className={inputClasses}
              />
              <FieldError id="co-mpesa-err" message={errors.mpesaPhone} />
              <p className="mt-3 text-sm text-aurum-obsidian/55">When you place your order we&apos;ll send a request to this number — enter your M-Pesa PIN on your phone to pay.</p>
            </div>
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
            {stage === "placing" ? "Placing order…" : `Place Order & Pay — ${formatKES(total)}`}
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
              {fulfilment === "collection" ? "Pickup" : "Pick Up Mtaani"}
              {fulfilment === "delivery" && group && area && <span className="block text-xs text-aurum-obsidian/45">{area.name}, {group.name}</span>}
              {fulfilment === "collection" && pickup && <span className="block text-xs text-aurum-obsidian/45">{pickup.name}</span>}
            </span>
            <span className="shrink-0">{fulfilment === "collection" ? "Free" : area ? formatKES(shippingTotal) : "Choose agent"}</span>
          </div>
          <div className="flex items-center justify-between border-t border-[var(--border-subtle)] pt-2 font-display text-lg">
            <span>Total</span>
            <span>{formatKES(total)}</span>
          </div>
        </div>
        {fulfilment === "delivery" && area && (area.agentLocation || location.trim()) && (
          <p className="mt-4 flex gap-2 border-t border-[var(--border-subtle)] pt-4 text-xs text-aurum-obsidian/60">
            <MapPin size={14} strokeWidth={1.5} className="shrink-0" />
            <span>Collect from {needsLocation ? `${location.trim()}, ${area.name}` : `${area.name}, ${area.agentLocation}`}</span>
          </p>
        )}
      </div>
    </div>
  );
}

/** One Pick Up Mtaani agent (or town) with its address, hours and fee. */
function AgentCard({ group, area, selected, onSelect, showGroup = false }: { group: DeliveryGroup; area: DeliveryArea; selected: boolean; onSelect: () => void; showGroup?: boolean }) {
  return (
    <ChoiceCard selected={selected} onSelect={onSelect} className="flex items-start justify-between gap-4 py-3 pl-4 pr-12">
      <span className="min-w-0">
        {showGroup && <span className="block text-[10px] uppercase tracking-widest text-aurum-obsidian/45">{group.name}</span>}
        <span className="block text-sm font-medium">{area.name}</span>
        {area.agentLocation && <span className="block text-xs text-aurum-obsidian/60">{area.agentLocation}</span>}
        {(area.hours || area.deliveryEstimate) && (
          <span className="mt-1 flex items-center gap-1 text-xs text-aurum-obsidian/45">
            <Clock size={11} strokeWidth={1.5} className="shrink-0" />
            {[area.hours, area.deliveryEstimate].filter(Boolean).join(" · ")}
          </span>
        )}
      </span>
      <span className="shrink-0 text-sm font-medium">{formatKES(area.amount)}</span>
    </ChoiceCard>
  );
}
