import type { Metadata } from "next";
import Link from "next/link";
import { RevealText } from "@/components/motion/RevealText";
import { FadeIn } from "@/components/motion/FadeIn";
import { ImageReveal } from "@/components/motion/ImageReveal";
import { MagneticButton } from "@/components/motion/MagneticButton";
import { EditorialImage } from "@/components/ui/EditorialImage";
import { AccountAuthPanel } from "@/components/account/AccountAuthPanel";
import { SignOutButton } from "@/components/account/SignOutButton";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { safeNextPath } from "@/lib/auth-redirect";
import { SITE_IMAGES } from "@/lib/site-images";

export const metadata: Metadata = { title: "Account", robots: { index: false, follow: false } };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function AccountPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const user = isSupabaseConfigured() ? (await (await createClient()).auth.getUser()).data.user : null;
  const firstName = (user?.user_metadata.full_name as string | undefined)?.split(" ")[0];

  return (
    <div className="py-section-sm pt-32 sm:pt-40">
      <div className="container-aurum grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
        <div>
          <p className="mb-3 text-xs uppercase tracking-[0.3em] text-aurum-obsidian/50">Account</p>
          <RevealText
            as="h1"
            text={user ? `Welcome, ${firstName ?? "Aurum customer"}.` : "Your Aurum account."}
            className="font-display text-4xl leading-[1.05] sm:text-6xl"
          />
          <FadeIn delay={0.3}>
            {user ? (
              <>
                <p className="mt-6 max-w-md text-sm leading-relaxed text-aurum-obsidian/70 sm:text-base">
                  Signed in as <span className="text-aurum-obsidian">{user.email}</span>. Track your orders and revisit the pieces you&apos;ve saved.
                </p>
                <div className="mt-8 flex flex-wrap items-center gap-4">
                  <MagneticButton>
                    <Link href="/orders" data-cursor="view" className="inline-flex items-center bg-aurum-deep px-8 py-4 text-xs uppercase tracking-[0.2em] text-aurum-ivory transition-colors hover:bg-aurum-plum">
                      View Orders
                    </Link>
                  </MagneticButton>
                  <MagneticButton>
                    <Link href="/wishlist" data-cursor="view" className="inline-flex items-center border border-aurum-obsidian/30 px-8 py-4 text-xs uppercase tracking-[0.2em] transition-colors hover:border-aurum-obsidian">
                      Wishlist
                    </Link>
                  </MagneticButton>
                  <SignOutButton className="px-2 py-4 text-xs uppercase tracking-[0.2em] text-aurum-obsidian/60 underline-offset-4 transition-colors hover:text-aurum-obsidian hover:underline" />
                </div>
              </>
            ) : (
              <>
                <p className="mb-8 mt-6 max-w-md text-sm leading-relaxed text-aurum-obsidian/70 sm:text-base">
                  Sign in or create an account to save your bag, wishlist and order history.
                </p>
                <AccountAuthPanel initialMode={one(sp.mode) === "signup" ? "signup" : "signin"} next={safeNextPath(one(sp.next))} authError={one(sp.auth_error)} />
              </>
            )}
          </FadeIn>
        </div>
        <ImageReveal className="hidden aspect-[4/5] w-full lg:block">
          <EditorialImage image={SITE_IMAGES.account} className="h-full w-full" />
        </ImageReveal>
      </div>
    </div>
  );
}
