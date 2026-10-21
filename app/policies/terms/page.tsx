import type { Metadata } from "next";
import Link from "next/link";
import { PolicySection, SimplePage } from "@/components/ui/SimplePageHeader";
import { CONTACT, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms that apply when you use the Aurum Entonet website and buy from us.",
};

export default function TermsPage() {
  const site = SITE_URL.replace(/^https?:\/\//, "");
  return (
    <SimplePage title="Terms of Service" updated="21 October 2026">
      <p>
        These terms apply when you use {site} and when you buy from Aurum Entonet, a jewellery business based in Kahawa Sukari,
        Nairobi, Kenya (&ldquo;we&rdquo;, &ldquo;us&rdquo;). By placing an order you agree to them, so please read them
        alongside our{" "}
        <Link href="/policies/shipping-returns" className="underline underline-offset-4">
          Shipping &amp; Returns
        </Link>{" "}
        and{" "}
        <Link href="/policies/privacy" className="underline underline-offset-4">
          Privacy Policy
        </Link>
        .
      </p>

      <PolicySection title="Your account">
        <p>
          You need an account to add pieces to your bag and place an order. You can sign up with your email address or with
          Google. Please give accurate details and keep your password private — you are responsible for orders placed from your
          account. We may suspend accounts that are misused.
        </p>
      </PolicySection>

      <PolicySection title="Our pieces">
        <p>
          Our jewellery is handmade, so small differences in colour, finish, beading and size from the photos are part of each
          piece&apos;s character and are not faults. Colours can also look slightly different on different screens. We describe
          materials and sizes as accurately as we can on each product page.
        </p>
      </PolicySection>

      <PolicySection title="Prices and payment">
        <ul className="ml-5 list-disc space-y-2">
          <li>All prices are in Kenyan Shillings (KSh) and include any applicable taxes. The delivery fee is shown separately at checkout.</li>
          <li>We currently accept payment by M-Pesa. When you place an order, we send a payment request to the M-Pesa number you give; you approve it with your M-Pesa PIN on your phone.</li>
          <li>Prices and offers can change at any time, but the price you pay is the one shown when you placed your order.</li>
          <li>If a price is shown wrongly because of an obvious error, we will contact you before sending your order, and you may cancel for a full refund.</li>
        </ul>
      </PolicySection>

      <PolicySection title="Your order">
        <p>
          Placing an order is an offer to buy. Your order is confirmed once your M-Pesa payment is received, and we let you know
          by email and WhatsApp. Pieces in your order are held for you while payment is pending; an order that stays unpaid may be
          cancelled so the pieces can be offered to others.
        </p>
        <p>
          Occasionally we may have to cancel an order — for example if a piece turns out to be unavailable or cannot be made to
          our standard. If that happens, we will tell you straight away and refund everything you paid.
        </p>
      </PolicySection>

      <PolicySection title="Delivery, collection and returns">
        <p>
          Orders are delivered through Pick Up Mtaani agents or collected free from our shop. Delivery times, fees, collection,
          returns, refunds and cancellations are explained in our{" "}
          <Link href="/policies/shipping-returns" className="underline underline-offset-4">
            Shipping &amp; Returns
          </Link>{" "}
          policy, which forms part of these terms. Once your parcel has been handed to you or your nominated collector, it is your
          responsibility.
        </p>
      </PolicySection>

      <PolicySection title="Caring for your jewellery">
        <p>
          Follow the care instructions on each product page. We are not responsible for wear and tear, or for damage caused by
          water, perfume, chemicals, accidents or misuse.
        </p>
      </PolicySection>

      <PolicySection title="Our designs and content">
        <p>
          The designs, photographs, text and branding on this website belong to Aurum Entonet. You may share links and images of
          our pieces for personal, non-commercial use, but you may not copy, reproduce or sell our designs or content without our
          written permission.
        </p>
      </PolicySection>

      <PolicySection title="Using this website">
        <p>
          Please don&apos;t misuse the website — for example by trying to access accounts or areas that are not yours, interfering
          with how it works, or placing orders in someone else&apos;s name without their permission. We work to keep the website
          available and accurate, but cannot promise it will always be uninterrupted or error-free.
        </p>
      </PolicySection>

      <PolicySection title="Our responsibility to you">
        <p>
          If something goes wrong with your order, our responsibility is limited to replacing the piece or refunding what you
          paid for it. Nothing in these terms takes away the rights you have as a consumer under Kenyan law, including the Consumer
          Protection Act.
        </p>
      </PolicySection>

      <PolicySection title="Changes to these terms">
        <p>
          We may update these terms from time to time. The version on this page when you place an order is the one that applies
          to it.
        </p>
      </PolicySection>

      <PolicySection title="Law and contact">
        <p>
          These terms are governed by the laws of Kenya. If you have a concern, please contact us first — on WhatsApp at{" "}
          {CONTACT.whatsappDisplay} or by email at{" "}
          <a href={`mailto:${CONTACT.email}`} className="underline underline-offset-4">
            {CONTACT.email}
          </a>{" "}
          — and we will do our best to put it right.
        </p>
      </PolicySection>
    </SimplePage>
  );
}
