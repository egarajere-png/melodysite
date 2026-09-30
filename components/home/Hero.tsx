"use client";

import Link from "next/link";
import { ParallaxImage } from "@/components/motion/ParallaxImage";
import { RevealText } from "@/components/motion/RevealText";
import { FadeIn } from "@/components/motion/FadeIn";
import { MagneticButton } from "@/components/motion/MagneticButton";
import { usePreloaderReady } from "@/lib/usePreloaderReady";
import { SITE_IMAGES } from "@/lib/site-images";

// Entrance delays (s) for headline → subline → buttons → edge details. Straight after
// the invitation opens they step in one by one, roughly a second apart; on any other
// visit the Hero keeps its usual quick cascade.
const INTRO_STEPS = [0.2, 1.1, 2.0, 2.9] as const;
const DEFAULT_STEPS = [0, 0.3, 0.5, 0.8] as const;

export function Hero() {
  const { ready, fromIntro } = usePreloaderReady();
  const [headline, subline, actions, details] = fromIntro ? INTRO_STEPS : DEFAULT_STEPS;
  const duration = fromIntro ? 1.2 : undefined;

  return (
    <section className="relative flex h-dvh min-h-[640px] w-full items-end overflow-hidden bg-aurum-obsidian text-aurum-ivory">
      <ParallaxImage image={SITE_IMAGES.homeHero} priority className="absolute inset-0 h-full w-full" strength={50} />
      <div className="absolute inset-0 bg-gradient-to-t from-aurum-obsidian via-aurum-obsidian/40 to-aurum-obsidian/10" />

      {ready && (
        <>
          <FadeIn delay={details} duration={duration} y={0} className="absolute left-6 top-24 z-10 hidden text-[11px] uppercase tracking-[0.35em] text-aurum-ivory/60 sm:block sm:left-[var(--gutter)]">
            Aurum Entonet — Nairobi, Kenya
          </FadeIn>

          <div className="container-aurum relative z-10 pb-20 sm:pb-28">
            <FadeIn delay={headline} duration={duration} y={0} className="sm:hidden">
              <p className="mb-4 text-xs uppercase tracking-[0.3em] text-aurum-ivory/60">
                Aurum Entonet — Nairobi, Kenya
              </p>
            </FadeIn>
            <RevealText
              as="h1"
              text="Wear Your Heritage."
              delay={headline}
              wordDelay={fromIntro ? 0.12 : undefined}
              className="max-w-3xl font-display text-5xl leading-[0.95] sm:text-7xl lg:text-8xl"
            />
            <FadeIn delay={subline} duration={duration}>
              <p className="mt-6 max-w-md text-base text-aurum-ivory/80 sm:text-lg">
                Contemporary jewellery inspired by African heritage and reimagined for today.
              </p>
            </FadeIn>
            <FadeIn delay={actions} duration={duration}>
              <div className="mt-9 flex flex-wrap gap-4">
                <MagneticButton>
                  <Link
                    href="/shop"
                    data-cursor="view"
                    className="inline-flex items-center bg-aurum-ivory px-8 py-4 text-xs uppercase tracking-[0.2em] text-aurum-obsidian transition-colors hover:bg-aurum-gold"
                  >
                    Explore Collection
                  </Link>
                </MagneticButton>
                <MagneticButton>
                  <Link
                    href="/about"
                    data-cursor="view"
                    className="inline-flex items-center border border-aurum-ivory/40 px-8 py-4 text-xs uppercase tracking-[0.2em] transition-colors hover:border-aurum-ivory"
                  >
                    Discover Aurum
                  </Link>
                </MagneticButton>
              </div>
            </FadeIn>
          </div>

          <FadeIn delay={details} duration={duration} className="absolute bottom-8 left-6 hidden text-[10px] uppercase tracking-[0.3em] text-aurum-ivory/40 sm:block sm:left-[var(--gutter)]">
            01 — Arrival
          </FadeIn>
          <FadeIn delay={details} duration={duration} className="absolute bottom-8 right-6 hidden text-[10px] uppercase tracking-[0.3em] text-aurum-ivory/50 sm:block sm:right-[var(--gutter)]">
            Scroll
          </FadeIn>
        </>
      )}
    </section>
  );
}
