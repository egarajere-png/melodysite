"use client";

import { useEffect, useState } from "react";
import { hasPreloaded, onPreloaderDone } from "@/lib/preloader";

/**
 * True once the entrance preloader has finished (or was skipped — reduced motion, or
 * already shown earlier this session). Lets above-the-fold content, like the Hero
 * headline, hold its entrance animation until the flag curtain actually lifts, so it
 * reappears on cue rather than animating in underneath the preloader unseen.
 */
export function usePreloaderReady() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || hasPreloaded()) {
      // sessionStorage/matchMedia are only readable client-side, so this can only be
      // decided inside an effect.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setReady(true);
      return;
    }
    return onPreloaderDone(() => setReady(true));
  }, []);

  return ready;
}
