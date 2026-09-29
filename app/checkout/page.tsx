import type { Metadata } from "next";
import { RevealText } from "@/components/motion/RevealText";
import { CheckoutClient } from "@/components/checkout/CheckoutClient";
import { AuthOptions } from "@/components/account/AuthOptions";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getAddresses } from "@/lib/supabase/addresses";
import { getShippingRates } from "@/lib/supabase/shipping";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

export default async function CheckoutPage() {
  const user = isSupabaseConfigured() ? (await (await createClient()).auth.getUser()).data.user : null;
  const [addresses, shippingRates] = user
    ? await Promise.all([getAddresses(user.id), getShippingRates()])
    : [[], []];

  return (
    <div className="pt-32 pb-24 sm:pt-40">
      <div className="container-aurum">
        <RevealText as="h1" text="Checkout" className="mb-12 font-display text-4xl sm:text-5xl" />
        {!user ? (
          <div className="flex flex-col items-center gap-5 py-16 text-center">
            <p className="max-w-sm text-sm text-aurum-obsidian/60">Sign in to check out — your order and bag are tied to your account.</p>
            <AuthOptions next="/checkout" />
          </div>
        ) : (
          <CheckoutClient addresses={addresses} shippingRates={shippingRates} />
        )}
      </div>
    </div>
  );
}
