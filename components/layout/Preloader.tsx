"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { PRELOADER_SKIP_ATTR, markPreloaderDone } from "@/lib/preloader";
import "./preloader.css";

type Phase = "loading" | "ready" | "opening";

/** How long the seal's progress ring turns before the envelope can be opened. */
const READY_AFTER = 3500;
/** When the curtain starts fading to the page — the homepage begins its entrance here. */
const REVEAL_AT = 2550;
/** When the curtain has fully faded and unmounts. */
const FINISH_AT = 3150;

/**
 * Full-screen entrance invitation — a sealed ivory envelope that the visitor opens.
 * The seal's gold ring turns while the page settles, then "Tap to open" appears; on
 * tap the flap (carrying the seal) glides up, the lower half glides down, "Aurum
 * Entonet" rises on deep plum, and the curtain fades to reveal the page beneath.
 *
 * Server-rendered so the page never flashes before it; the inline head script in the
 * root layout hides it before paint once it has been opened this session, or under
 * prefers-reduced-motion. `markPreloaderDone()` fires as the fade begins, which is the
 * cue the Hero and Navbar use to start their staggered entrance.
 */
export function Preloader() {
  const [visible, setVisible] = useState(true);
  const [phase, setPhase] = useState<Phase>("loading");
  const phaseRef = useRef<Phase>("loading");

  useEffect(() => {
    if (document.documentElement.hasAttribute(PRELOADER_SKIP_ATTR)) {
      // Whether it was already opened this session is only knowable client-side.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVisible(false);
      return;
    }
    const readyTimer = window.setTimeout(() => {
      phaseRef.current = "ready";
      setPhase("ready");
    }, READY_AFTER);
    return () => window.clearTimeout(readyTimer);
  }, []);

  useEffect(() => {
    if (phase !== "opening") return;
    const revealTimer = window.setTimeout(markPreloaderDone, REVEAL_AT);
    const finishTimer = window.setTimeout(() => {
      // Also covers a later remount of the shell (e.g. returning from /admin) without a reload.
      document.documentElement.setAttribute(PRELOADER_SKIP_ATTR, "");
      setVisible(false);
    }, FINISH_AT);
    return () => {
      window.clearTimeout(revealTimer);
      window.clearTimeout(finishTimer);
    };
  }, [phase]);

  function open() {
    if (phaseRef.current !== "ready") return;
    phaseRef.current = "opening";
    setPhase("opening");
  }

  if (!visible) return null;

  return (
    <button
      type="button"
      className="ae-preloader"
      data-phase={phase}
      onClick={open}
      aria-label={phase === "ready" ? "Open the invitation" : "Aurum Entonet invitation"}
      aria-disabled={phase !== "ready"}
      tabIndex={phase === "ready" ? 0 : -1}
    >
      <span className="ae-envelope" aria-hidden="true">
        <span className="ae-bottom-panel" />
        <span className="ae-top-panel">
          <span className="ae-seal-wrap">
            <span className="ae-progress" />
            <Image
              className="ae-seal"
              src="/images/brand/wax-seal.png"
              alt=""
              width={480}
              height={480}
              sizes="122px"
              priority
              draggable={false}
            />
          </span>
        </span>
      </span>
      <span className="ae-invitation-prompt" aria-hidden="true">
        <span className="ae-prompt-script">Tap to open</span>
        <span className="ae-prompt-rule" />
      </span>
      <span className="ae-brand" aria-hidden="true">
        <span className="ae-brand-line ae-brand-first">Aurum</span>
        <span className="ae-brand-line ae-brand-second">Entonet</span>
        <span className="ae-brand-line ae-brand-tagline">A handmade story in Kenya</span>
      </span>
    </button>
  );
}
