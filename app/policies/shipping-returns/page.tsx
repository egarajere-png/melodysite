import type { Metadata } from "next";
import Link from "next/link";
import { PolicySection, SimplePage } from "@/components/ui/SimplePageHeader";
import { CONTACT, WHATSAPP_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Shipping & Returns",
  description: "How Aurum Entonet orders are delivered through Pick Up Mtaani or collected from our Kahawa Sukari shop, and how returns and refunds work.",
};

const RATES = [
  { where: "Pick Up Mtaani agents in the Nairobi CBD", fee: "KSh 100" },
  { where: "All other Pick Up Mtaani agents in Nairobi and its surroundings", fee: "KSh 180" },
  { where: "Nakuru, Nyeri, Thika and Machakos", fee: "KSh 200" },
  { where: "Other towns in Kenya", fee: "KSh 250" },
  { where: "Collection from our shop in Kahawa Sukari", fee: "Free" },
];

export default function ShippingReturnsPage() {
  return (
    <SimplePage title="Shipping & Returns" updated="21 October 2026">
      <PolicySection title="How your order reaches you">
        <p>You choose one of two options at checkout:</p>
        <ul className="ml-5 list-disc space-y-2">
          <li>
            <strong className="font-medium text-aurum-obsidian">Pick Up Mtaani.</strong> We send your order through{" "}
            <a href="https://new.pickupmtaani.com/" target="_blank" rel="noreferrer" className="underline underline-offset-4">
              Pick Up Mtaani
            </a>{" "}
            to the agent you choose — a shop near you, such as a salon, cyber café or boutique — and you collect it there. Outside
            Nairobi, you tell us your town and where you would like to collect, and we confirm the collection point with you
            before sending.
          </li>
          <li>
            <strong className="font-medium text-aurum-obsidian">Shop pickup.</strong> Collect your order free of charge from our
            shop in Kahawa Sukari, Nairobi. We will message you as soon as it is ready.
          </li>
        </ul>
        <p>We currently deliver within Kenya only.</p>
      </PolicySection>

      <PolicySection title="Delivery fees">
        <p>The fee is shown at checkout as soon as you choose your agent or town, and is paid together with your order.</p>
        <div className="border border-[var(--border-strong)]">
          {RATES.map((r) => (
            <div key={r.where} className="flex items-start justify-between gap-4 border-b border-[var(--border-subtle)] px-4 py-3 last:border-0">
              <span>{r.where}</span>
              <span className="shrink-0 font-medium text-aurum-obsidian">{r.fee}</span>
            </div>
          ))}
        </div>
      </PolicySection>

      <PolicySection title="When it will arrive">
        <p>
          We begin preparing your order as soon as your M-Pesa payment is confirmed. Each piece is finished and checked by hand,
          so please allow up to 3 working days for us to prepare it before it is handed to Pick Up Mtaani.
        </p>
        <p>
          Once dispatched, parcels usually reach Nairobi agents the next day and agents in other towns within 1–2 days. These are
          Pick Up Mtaani&apos;s usual times rather than guarantees, and public holidays or high demand can add a day or two.
        </p>
        <p>
          We email and WhatsApp you at every step. When your parcel is booked, we send you its Pick Up Mtaani tracking code,
          which also appears on your order page, and Pick Up Mtaani will send you an SMS when it is on its way.
        </p>
      </PolicySection>

      <PolicySection title="Collecting your order">
        <p>
          Collect your parcel during the agent&apos;s opening hours, which are shown when you choose the agent. Please bring your
          order number or tracking code; the agent may also ask to see an ID. If someone else is collecting for you, enter their
          name and phone number at checkout.
        </p>
        <p>
          Please collect your parcel promptly. Parcels left uncollected for a long time may be returned by Pick Up Mtaani, and
          sending them out again will carry a new delivery fee.
        </p>
      </PolicySection>

      <PolicySection title="Returns and exchanges">
        <p>
          If you are not happy with a piece, you may return or exchange it within <strong className="font-medium text-aurum-obsidian">14 days</strong> of
          collecting it, as long as it is unworn, undamaged and in its original packaging.
        </p>
        <p>
          For hygiene reasons, earrings, piercings, belly rings and other body jewellery can only be returned if they are faulty.
          Personalised or custom-made pieces can only be returned if they are faulty.
        </p>
        <p>
          To start a return, message us on{" "}
          <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="underline underline-offset-4">
            WhatsApp ({CONTACT.whatsappDisplay})
          </a>{" "}
          or email{" "}
          <a href={`mailto:${CONTACT.email}`} className="underline underline-offset-4">
            {CONTACT.email}
          </a>{" "}
          with your order number. We will tell you how to send the piece back. Return delivery is paid by you, unless the piece
          is faulty or we sent the wrong one.
        </p>
      </PolicySection>

      <PolicySection title="Faulty or wrong items">
        <p>
          If a piece arrives damaged or faulty, or is not what you ordered, contact us within 7 days of collecting it with your
          order number and a photo. We will replace or refund it, and cover the cost of sending it back.
        </p>
      </PolicySection>

      <PolicySection title="Refunds">
        <p>
          Once we have received and checked a returned piece, we refund the price of the piece to the M-Pesa number you paid
          from, usually within 7 days. The original delivery fee is refunded only if the piece was faulty or we made a mistake.
          We will let you know by email and WhatsApp when your refund has been sent.
        </p>
      </PolicySection>

      <PolicySection title="Cancelling an order">
        <p>
          You can cancel an order free of charge until it has been dispatched — just message us. If you have already paid, we
          refund the full amount, including the delivery fee, to your M-Pesa number. Once your order has been handed to Pick Up
          Mtaani, it can no longer be cancelled, but you can return it as described above.
        </p>
      </PolicySection>

      <PolicySection title="Questions">
        <p>
          We are happy to help. Reach us on WhatsApp at {CONTACT.whatsappDisplay}, by email at {CONTACT.email}, or through our{" "}
          <Link href="/contact" className="underline underline-offset-4">
            contact page
          </Link>
          .
        </p>
      </PolicySection>
    </SimplePage>
  );
}
