import type { Metadata } from "next";
import { RevealText } from "@/components/motion/RevealText";
import { CheckoutClient } from "@/components/checkout/CheckoutClient";
import { AuthOptions } from "@/components/account/AuthOptions";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getDeliveryOptions } from "@/lib/supabase/shipping";
import { getCheckoutPrefill } from "@/lib/supabase/orders";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

export default async function CheckoutPage() {
  const user = isSupabaseConfigured() ? (await (await createClient()).auth.getUser()).data.user : null;
  const [options, prefill] = user ? await Promise.all([getDeliveryOptions(), getCheckoutPrefill(user.id)]) : [null, null];

  return (
    <div className="pt-32 pb-24 sm:pt-40">
      <div className="container-aurum">
        <RevealText as="h1" text="Checkout" className="mb-12 font-display text-4xl sm:text-5xl" />
        {!user || !options || !prefill ? (
          <div className="flex flex-col items-center gap-5 py-16 text-center">
            <p className="max-w-sm text-sm text-aurum-obsidian/60">Sign in to check out — your bag and orders are saved to your account.</p>
            <AuthOptions next="/checkout" />
          </div>
        ) : (
          <CheckoutClient
            options={options}
            prefill={prefill}
            customerName={(user.user_metadata?.full_name as string | undefined) ?? ""}
            customerEmail={user.email ?? ""}
          />
        )}
      </div>
    </div>
  );
}
