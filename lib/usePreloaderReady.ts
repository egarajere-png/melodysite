"use client";

import { useEffect, useState } from "react";
import { hasPreloaded, onPreloaderDone } from "@/lib/preloader";

/**
 * `ready` is true once the entrance invitation has finished (or was skipped — reduced
 * motion, or already opened earlier this session). Lets above-the-fold content, like the
 * Hero headline, hold its entrance until the envelope actually parts, so it appears on
 * cue rather than animating in underneath the invitation unseen.
 *
 * `fromIntro` is true only when readiness arrived from the invitation just now — callers
 * use it to stretch their entrance into the slow, one-by-one reveal that follows it.
 */
export function usePreloaderReady() {
  const [state, setState] = useState({ ready: false, fromIntro: false });

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || hasPreloaded()) {
      // sessionStorage/matchMedia are only readable client-side, so this can only be
      // decided inside an effect.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState({ ready: true, fromIntro: false });
      return;
    }
    return onPreloaderDone(() => setState({ ready: true, fromIntro: true }));
  }, []);

  return state;
}
