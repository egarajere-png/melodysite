import type { Metadata } from "next";
import Link from "next/link";
import { RevealText } from "@/components/motion/RevealText";
import { FadeIn } from "@/components/motion/FadeIn";
import { ImageReveal } from "@/components/motion/ImageReveal";
import { MagneticButton } from "@/components/motion/MagneticButton";
import { EditorialImage } from "@/components/ui/EditorialImage";

export const metadata: Metadata = { title: "Account", robots: { index: false, follow: false } };

export default function AccountPage() {
  return (
    <div className="py-section-sm pt-32 sm:pt-40">
      <div className="container-aurum grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
        <div>
          <p className="mb-3 text-xs uppercase tracking-[0.3em] text-aurum-obsidian/50">Account</p>
          <RevealText as="h1" text="Your Aurum account is coming." className="font-display text-4xl leading-[1.05] sm:text-6xl" />
          <FadeIn delay={0.3}>
            <p className="mt-6 max-w-md text-sm leading-relaxed text-aurum-obsidian/70 sm:text-base">
              Sign-in, saved addresses, wishlists and order history will live here once accounts go live. For now,
              every order can still be tracked with just its reference number.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <MagneticButton>
                <Link
                  href="/orders"
                  data-cursor="view"
                  className="inline-flex items-center bg-aurum-deep px-8 py-4 text-xs uppercase tracking-[0.2em] text-aurum-ivory transition-colors hover:bg-aurum-plum"
                >
                  Track an Order
                </Link>
              </MagneticButton>
              <MagneticButton>
                <Link
                  href="/contact"
                  data-cursor="view"
                  className="inline-flex items-center border border-aurum-obsidian/30 px-8 py-4 text-xs uppercase tracking-[0.2em] transition-colors hover:border-aurum-obsidian"
                >
                  Contact Us
                </Link>
              </MagneticButton>
            </div>
          </FadeIn>
        </div>
        <ImageReveal className="aspect-[4/5] w-full">
          <EditorialImage image={{ id: "account-placeholder", alt: "", kind: "editorial", tone: "plum" }} className="h-full w-full" />
        </ImageReveal>
      </div>
    </div>
  );
}
