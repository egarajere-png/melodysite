import type { Metadata } from "next";
import { RevealText } from "@/components/motion/RevealText";
import { CheckoutClient } from "@/components/checkout/CheckoutClient";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return (
    <div className="pt-32 pb-24 sm:pt-40">
      <div className="container-aurum">
        <RevealText as="h1" text="Checkout" className="mb-12 font-display text-4xl sm:text-5xl" />
        <CheckoutClient />
      </div>
    </div>
  );
}
