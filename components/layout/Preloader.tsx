"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { easeLuxury } from "@/lib/motion";
import { hasPreloaded, markPreloaderDone } from "@/lib/preloader";

const DURATION = 5000;

/** A stylised, darkened rendering of the Kenyan flag — full black/red/green bands
 *  would fight the rest of the brand palette, so it's tinted to sit inside the same
 *  obsidian/gold language as everything else on the site. */
function KenyaFlag() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 900 600"
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 h-full w-full"
    >
      <rect x="0" y="0" width="900" height="174" fill="#0a0a0a" />
      <rect x="0" y="174" width="900" height="18" fill="#f4f0e8" />
      <rect x="0" y="192" width="900" height="216" fill="#8a1c1c" />
      <rect x="0" y="408" width="900" height="18" fill="#f4f0e8" />
      <rect x="0" y="426" width="900" height="174" fill="#1f4a2e" />

      {/* spears, crossed behind the shield */}
      <g stroke="#0a0a0a" strokeWidth="10" strokeLinecap="round">
        <line x1="330" y1="440" x2="570" y2="160" />
        <line x1="570" y1="440" x2="330" y2="160" />
      </g>
      <g fill="#f4f0e8" stroke="#0a0a0a" strokeWidth="4">
        <path d="M 570 160 L 585 190 L 555 190 Z" />
        <path d="M 330 160 L 345 190 L 315 190 Z" />
      </g>

      {/* shield */}
      <path
        d="M450,205 C512,205 540,250 540,305 C540,368 502,412 450,428 C398,412 360,368 360,305 C360,250 388,205 450,205 Z"
        fill="#f4f0e8"
        stroke="#0a0a0a"
        strokeWidth="8"
      />
      <path d="M450,235 L500,305 L450,375 L400,305 Z" fill="#8a1c1c" stroke="#0a0a0a" strokeWidth="6" />
    </svg>
  );
}

/**
 * Full-screen entrance preloader — the Kenyan flag as a darkened cinematic backdrop,
 * "Proudly Made in Kenya" sliding in from the left, and a 0–100 counter with its own
 * loader bar bottom-right, all timed to a fixed 5s count. On completion the whole panel
 * slides up and off, and fires `markPreloaderDone()` as that lift begins so the Hero
 * headline reappears in step with the reveal rather than sitting there already visible.
 *
 * Runs once per browser session on first load only — never on subsequent client-side
 * navigation — and is skipped entirely under prefers-reduced-motion.
 */
export function Preloader() {
  const reduce = useReducedMotion();
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (reduce || hasPreloaded()) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisible(true);
    document.body.style.overflow = "hidden";

    const start = performance.now();
    let raf = 0;

    function tick(now: number) {
      const elapsed = now - start;
      const pct = Math.min(100, Math.round((elapsed / DURATION) * 100));
      setProgress(pct);
      if (elapsed < DURATION) {
        raf = requestAnimationFrame(tick);
      } else {
        window.setTimeout(() => {
          setVisible(false);
          document.body.style.overflow = "";
          markPreloaderDone();
        }, 400);
      }
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduce]);

  if (reduce) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[var(--z-preloader)] overflow-hidden bg-aurum-obsidian text-aurum-ivory"
          exit={{ y: "-100%" }}
          transition={{ duration: 1, ease: easeLuxury }}
        >
          <KenyaFlag />
          <div className="absolute inset-0 bg-gradient-to-b from-aurum-obsidian/70 via-aurum-obsidian/50 to-aurum-obsidian/85" />

          <p className="absolute left-6 top-8 text-[10px] uppercase tracking-[0.4em] text-aurum-ivory/50 sm:left-[var(--gutter)]">
            Aurum Entonet
          </p>

          <div className="relative flex h-full items-center overflow-hidden">
            <AnimatePresence>
              {progress < 100 && (
                <motion.p
                  initial={{ x: "-100%", opacity: 0 }}
                  animate={{ x: "0%", opacity: 1 }}
                  exit={{ x: "40%", opacity: 0 }}
                  transition={{ duration: 1.1, ease: easeLuxury }}
                  className="container-aurum font-display text-3xl italic tracking-wide sm:text-5xl lg:text-6xl"
                >
                  Proudly Made in Kenya
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          <div className="absolute bottom-8 right-6 text-right sm:right-[var(--gutter)]">
            <p aria-live="polite" className="font-display text-4xl tabular-nums sm:text-5xl">
              {String(progress).padStart(2, "0")}
            </p>
            <div className="mt-3 h-px w-28 bg-aurum-ivory/25 sm:w-36">
              <motion.div
                className="h-full origin-left bg-aurum-gold"
                animate={{ scaleX: progress / 100 }}
                transition={{ duration: 0.1, ease: "linear" }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
