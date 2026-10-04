"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Smartphone } from "lucide-react";
import { formatKES } from "@/lib/format";
import { toMpesaMsisdn } from "@/lib/payments/phone";
import { whatsappLink } from "@/lib/support";
import { getMpesaPaymentStatusAction, startMpesaPaymentAction } from "@/app/actions/payments";
import type { MpesaPaymentView } from "@/lib/supabase/payments";

const POLL_EVERY_MS = 4000;

/**
 * Pays for an existing order with M-Pesa: sends the prompt, waits while the customer
 * enters their PIN, and shows the result. Used right after checkout and on the order
 * page, so a customer who closed the tab can come back and finish paying.
 */
export function MpesaPayment({
  orderNumber,
  accessToken,
  total,
  defaultPhone,
  initial,
  refreshOnPaid = false,
}: {
  orderNumber: string;
  /** Guest order link token; signed-in customers don't need one. */
  accessToken?: string;
  total: number;
  defaultPhone: string;
  initial: MpesaPaymentView;
  /** Re-render the surrounding server page (e.g. the order timeline) once paid. */
  refreshOnPaid?: boolean;
}) {
  const router = useRouter();
  const [view, setView] = useState(initial);
  const [phone, setPhone] = useState(defaultPhone);
  const [sending, setSending] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  const pending = view.state === "pending";
  useEffect(() => {
    if (!pending) return;
    let active = true;
    const timer = setInterval(async () => {
      const next = await getMpesaPaymentStatusAction(orderNumber, accessToken).catch(() => null);
      if (!active || !next) return;
      setView(next);
      if (next.state === "paid" && refreshOnPaid) router.refresh();
    }, POLL_EVERY_MS);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [pending, orderNumber, accessToken, refreshOnPaid, router]);

  async function handleSend(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!toMpesaMsisdn(phone)) {
      setPhoneError("Enter a valid Safaricom M-Pesa number, e.g. 0712 345 678.");
      return;
    }
    setPhoneError(null);
    setSending(true);
    const next = await startMpesaPaymentAction(orderNumber, accessToken, phone).catch(() => null);
    setSending(false);
    setView(next ?? { state: "failed", message: "We couldn't reach the server. Check your connection and try again.", receipt: null });
    if (next?.state === "paid" && refreshOnPaid) router.refresh();
  }

  const helpHref = whatsappLink(`Hello, I need help paying for order ${orderNumber} (${formatKES(total)}).`);

  if (view.state === "paid") {
    return (
      <div role="status" className="border border-aurum-gold/40 bg-aurum-gold/10 p-8 text-center">
        <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-aurum-deep text-aurum-ivory">
          <Check size={20} strokeWidth={2} />
        </span>
        <p className="mt-4 font-display text-2xl">Payment received</p>
        <p className="mt-2 text-sm text-aurum-obsidian/70">
          Thank you — order {orderNumber} is confirmed.
          {view.receipt && <span className="block">M-Pesa receipt {view.receipt}</span>}
        </p>
      </div>
    );
  }

  if (view.state === "pending") {
    return (
      <div role="status" className="border border-aurum-obsidian/15 bg-white p-8 text-center">
        <Loader2 size={28} strokeWidth={1.5} className="mx-auto animate-spin text-aurum-obsidian/60" />
        <p className="mt-4 font-display text-2xl">Check your phone</p>
        <p className="mt-2 text-sm leading-relaxed text-aurum-obsidian/70">
          We&apos;ve sent an M-Pesa request for {formatKES(total)}. Enter your M-Pesa PIN to pay — this page updates by itself once it goes through.
        </p>
        <p className="mt-4 text-xs text-aurum-obsidian/50">Please keep this page open. It can take up to a minute.</p>
      </div>
    );
  }

  if (view.state === "unavailable") {
    return (
      <div className="border border-aurum-obsidian/15 bg-white p-8 text-center">
        <p className="text-sm leading-relaxed text-aurum-obsidian/80">{view.message}</p>
        <a href={helpHref} target="_blank" rel="noreferrer" className="mt-6 inline-flex items-center bg-aurum-deep px-8 py-4 text-xs uppercase tracking-[0.2em] text-aurum-ivory transition-colors hover:bg-aurum-plum">
          Message us on WhatsApp
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSend} noValidate className="border border-aurum-obsidian/15 bg-white p-8">
      <div className="flex items-center gap-3">
        <Smartphone size={20} strokeWidth={1.5} className="text-aurum-obsidian/60" />
        <p className="font-display text-2xl">Pay {formatKES(total)} with M-Pesa</p>
      </div>
      {view.state === "failed" && view.message && (
        <p role="alert" className="mt-4 border-l-2 border-aurum-earth px-4 py-3 text-sm text-aurum-earth">
          {view.message}
        </p>
      )}
      <label htmlFor="mpesa-phone" className="mt-6 block text-[11px] uppercase tracking-widest text-aurum-obsidian/50">
        M-Pesa number
      </label>
      <input
        id="mpesa-phone"
        type="tel"
        autoComplete="tel"
        placeholder="e.g. 0712 345 678"
        value={phone}
        onChange={(e) => {
          setPhone(e.target.value);
          setPhoneError(null);
        }}
        aria-invalid={Boolean(phoneError)}
        aria-describedby="mpesa-phone-err"
        className="w-full border-b border-aurum-obsidian/25 bg-transparent py-3 text-sm placeholder:text-aurum-obsidian/40 focus-visible:border-aurum-obsidian focus-visible:outline-none aria-[invalid=true]:border-aurum-earth"
      />
      {phoneError && (
        <p id="mpesa-phone-err" className="mt-1.5 text-xs text-aurum-earth">
          {phoneError}
        </p>
      )}
      <button
        type="submit"
        disabled={sending}
        className="mt-6 w-full bg-aurum-deep px-8 py-4 text-xs uppercase tracking-[0.2em] text-aurum-ivory transition-colors hover:bg-aurum-plum disabled:opacity-60"
      >
        {sending ? "Sending request…" : view.state === "failed" ? "Try again" : "Send M-Pesa request"}
      </button>
      <p className="mt-4 text-center text-xs text-aurum-obsidian/50">
        You&apos;ll get a prompt on your phone to enter your M-Pesa PIN.{" "}
        <a href={helpHref} target="_blank" rel="noreferrer" className="underline underline-offset-4">
          Need help?
        </a>
      </p>
    </form>
  );
}
