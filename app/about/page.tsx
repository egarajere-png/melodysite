import type { Metadata } from "next";
import Link from "next/link";
import { RevealText } from "@/components/motion/RevealText";
import { FadeIn } from "@/components/motion/FadeIn";
import { ImageReveal } from "@/components/motion/ImageReveal";
import { ParallaxImage } from "@/components/motion/ParallaxImage";
import { EditorialImage } from "@/components/ui/EditorialImage";
import { MagneticButton } from "@/components/motion/MagneticButton";

export const metadata: Metadata = {
  title: "About Aurum",
  description:
    "The story of Aurum Entonet — a Kenyan jewellery house working at the meeting point of African heritage and contemporary design.",
};

export default function AboutPage() {
  return (
    <div>
      {/* Opening statement */}
      <section className="relative flex h-[90vh] min-h-[560px] items-end overflow-hidden bg-aurum-obsidian text-aurum-ivory">
        <ParallaxImage
          image={{ id: "about-hero", alt: "Aurum Entonet studio", kind: "editorial", tone: "obsidian" }}
          className="absolute inset-0 h-full w-full"
          strength={50}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-aurum-obsidian via-aurum-obsidian/30 to-transparent" />
        <div className="container-aurum relative z-10 pb-20">
          <p className="mb-4 text-xs uppercase tracking-[0.3em] text-aurum-ivory/60">About Aurum</p>
          <RevealText
            as="h1"
            text="The Story of Aurum."
            className="max-w-3xl font-display text-5xl leading-[0.98] sm:text-7xl lg:text-8xl"
          />
        </div>
      </section>

      {/* Our Story */}
      <section className="bg-aurum-ivory py-section">
        <div className="container-aurum grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="order-2 lg:order-1">
            <p className="mb-3 text-xs uppercase tracking-[0.3em] text-aurum-obsidian/50">01 — Our Story</p>
            <RevealText as="h2" text="Founded on a hand." className="font-display text-4xl sm:text-5xl" />
            <FadeIn delay={0.3}>
              <p className="mt-6 max-w-md text-sm leading-relaxed text-aurum-obsidian/70 sm:text-base">
                Aurum Entonet started as a small studio practice: sketch, cast, finish, repeat. Every collection
                is still built the same way — by hand, in small batches, with attention spent where it&apos;s least
                visible: the inside of a band, the weight of a clasp, the way a piece sits against skin.
              </p>
              <p className="mt-4 max-w-md text-sm text-aurum-obsidian/50">
                Full founding story to be added, pending client-approved copy.
              </p>
            </FadeIn>
          </div>
          <ImageReveal className="order-1 aspect-[4/5] w-full lg:order-2">
            <EditorialImage
              image={{ id: "about-story", alt: "Aurum Entonet studio practice", kind: "editorial", tone: "plum" }}
              className="h-full w-full"
            />
          </ImageReveal>
        </div>
      </section>

      {/* Made in Kenya — asymmetric collage */}
      <section className="bg-aurum-sand/25 py-section">
        <div className="container-aurum">
          <p className="mb-3 text-xs uppercase tracking-[0.3em] text-aurum-obsidian/50">02 — Made in Kenya</p>
          <RevealText as="h2" text="A Kenyan point of view." className="max-w-2xl font-display text-4xl sm:text-5xl" />
          <FadeIn delay={0.3}>
            <p className="mt-6 max-w-xl text-sm leading-relaxed text-aurum-obsidian/70 sm:text-base">
              Working from Nairobi shapes what we make and how we make it — the materials available locally, the
              artisans we work alongside, the pace of a small studio. It&apos;s a specific place, not a general idea
              of a continent.
            </p>
          </FadeIn>

          <div className="mt-14 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            <ImageReveal className="col-span-2 aspect-[4/5] lg:col-span-1 lg:translate-y-8">
              <EditorialImage image={{ id: "about-roots-1", alt: "Materials and texture", kind: "editorial", tone: "earth" }} className="h-full w-full" />
            </ImageReveal>
            <ImageReveal className="aspect-square lg:aspect-[4/5]">
              <EditorialImage image={{ id: "about-roots-2", alt: "Studio detail", kind: "product", tone: "sand" }} className="h-full w-full" />
            </ImageReveal>
            <ImageReveal className="aspect-square lg:aspect-[4/5] lg:translate-y-12">
              <EditorialImage image={{ id: "about-roots-3", alt: "Aurum Entonet piece detail", kind: "product", tone: "obsidian" }} className="h-full w-full" />
            </ImageReveal>
            <ImageReveal className="col-span-2 aspect-[4/5] lg:col-span-1">
              <EditorialImage image={{ id: "about-roots-4", alt: "Worn Aurum Entonet piece", kind: "worn", tone: "deep" }} className="h-full w-full" />
            </ImageReveal>
          </div>
        </div>
      </section>

      {/* Craft */}
      <section className="bg-aurum-ivory py-section">
        <div className="container-aurum grid gap-10 lg:grid-cols-2 lg:gap-16">
          <ImageReveal className="aspect-[4/5] w-full">
            <EditorialImage
              image={{ id: "about-craft", alt: "Hand-finishing a piece of jewellery", kind: "editorial", tone: "obsidian" }}
              className="h-full w-full"
            />
          </ImageReveal>
          <div>
            <p className="mb-3 text-xs uppercase tracking-[0.3em] text-aurum-obsidian/50">03 — Craft</p>
            <RevealText as="h2" text="Slow, deliberate, worn daily." className="font-display text-4xl sm:text-5xl" />
            <FadeIn delay={0.3}>
              <p className="mt-6 max-w-md text-sm leading-relaxed text-aurum-obsidian/70 sm:text-base">
                Jewellery is one of the oldest ways people mark meaning onto the body — a signet, a hoop, a chain
                passed on. We think about that weight before we think about trend: each piece is designed to be
                worn for years, not seasons.
              </p>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* The Aurum Philosophy — statement break */}
      <section className="bg-aurum-obsidian py-section-lg text-aurum-ivory">
        <div className="container-aurum text-center">
          <p className="mb-4 text-xs uppercase tracking-[0.3em] text-aurum-ivory/50">04 — The Aurum Philosophy</p>
          <RevealText
            as="h2"
            text="Heritage worn forward, not behind."
            className="font-display text-4xl leading-[1.05] sm:text-6xl lg:text-7xl"
          />
        </div>
      </section>

      {/* Our Community */}
      <section className="bg-aurum-ivory py-section">
        <div className="container-aurum grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
          <div>
            <p className="mb-3 text-xs uppercase tracking-[0.3em] text-aurum-obsidian/50">05 — Our Community</p>
            <RevealText as="h2" text="Made for the people who wear it." className="font-display text-4xl sm:text-5xl" />
            <FadeIn delay={0.3}>
              <p className="mt-6 max-w-md text-sm leading-relaxed text-aurum-obsidian/70 sm:text-base">
                Aurum is worn by a community as varied as the pieces themselves. We&apos;re building the space to
                share those stories properly — for now, follow along and get in touch directly.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <MagneticButton>
                  <Link
                    href="/shop"
                    data-cursor="view"
                    className="inline-flex items-center bg-aurum-deep px-8 py-4 text-xs uppercase tracking-[0.2em] text-aurum-ivory transition-colors hover:bg-aurum-plum"
                  >
                    Explore the Collection
                  </Link>
                </MagneticButton>
                <MagneticButton>
                  <Link
                    href="/contact"
                    data-cursor="view"
                    className="inline-flex items-center border border-aurum-obsidian/30 px-8 py-4 text-xs uppercase tracking-[0.2em] transition-colors hover:border-aurum-obsidian"
                  >
                    Get in Touch
                  </Link>
                </MagneticButton>
              </div>
            </FadeIn>
          </div>
          <ImageReveal className="aspect-[4/5] w-full">
            <EditorialImage image={{ id: "about-community", alt: "Aurum Entonet community", kind: "worn", tone: "sand" }} className="h-full w-full" />
          </ImageReveal>
        </div>
      </section>

      {/* Final CTA — dramatic close */}
      <section className="relative flex h-[70vh] min-h-[440px] items-center justify-center overflow-hidden bg-aurum-plum text-aurum-ivory">
        <div className="pointer-events-none absolute inset-0 opacity-40">
          <EditorialImage image={{ id: "about-final-cta", alt: "", kind: "editorial", tone: "deep" }} className="h-full w-full" />
        </div>
        <div className="container-aurum relative z-10 text-center">
          <p className="mb-4 text-xs uppercase tracking-[0.3em] text-aurum-ivory/50">06 — Begin</p>
          <RevealText
            as="h2"
            text="Discover Aurum."
            className="font-display text-6xl leading-[0.95] sm:text-8xl lg:text-9xl"
          />
          <FadeIn delay={0.4}>
            <div className="mt-10 flex justify-center">
              <MagneticButton>
                <Link
                  href="/shop"
                  data-cursor="view"
                  className="inline-flex items-center bg-aurum-ivory px-10 py-4 text-xs uppercase tracking-[0.2em] text-aurum-obsidian transition-colors hover:bg-aurum-gold"
                >
                  Explore the Collection
                </Link>
              </MagneticButton>
            </div>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}
