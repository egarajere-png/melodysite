"use client";

import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import { useEffect, useState } from "react";

/**
 * Desktop-only custom cursor. Reads `data-cursor="expand" | "view" | "explore" | "shop" | "open" | "drag"`
 * off whatever element is under the pointer and grows / labels itself accordingly. Never mounts on
 * touch devices, and never intercepts pointer events (pointer-events: none throughout).
 */
export function CustomCursor() {
  const reduce = useReducedMotion();
  const [enabled, setEnabled] = useState(false);
  const [variant, setVariant] = useState<string | null>(null);

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const springX = useSpring(x, { stiffness: 400, damping: 40, mass: 0.4 });
  const springY = useSpring(y, { stiffness: 400, damping: 40, mass: 0.4 });

  useEffect(() => {
    const isCoarse = window.matchMedia("(pointer: coarse)").matches;
    if (isCoarse || reduce) return;
    // Pointer type is only knowable client-side, so this one-time feature
    // detection must run in an effect rather than during render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEnabled(true);

    function handleMove(e: PointerEvent) {
      x.set(e.clientX);
      y.set(e.clientY);
      const target = (e.target as HTMLElement)?.closest?.("[data-cursor]") as HTMLElement | null;
      setVariant(target?.dataset.cursor ?? null);
    }

    window.addEventListener("pointermove", handleMove);
    return () => window.removeEventListener("pointermove", handleMove);
  }, [reduce, x, y]);

  if (!enabled) return null;

  const isWord =
    variant === "view" || variant === "explore" || variant === "drag" || variant === "shop" || variant === "open";
  const size = isWord ? 72 : variant === "expand" ? 44 : 16;

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[var(--z-cursor)] hidden items-center justify-center rounded-full bg-aurum-ivory text-[10px] font-medium uppercase tracking-widest text-aurum-obsidian mix-blend-difference md:flex"
      style={{ x: springX, y: springY, translateX: "-50%", translateY: "-50%" }}
      animate={{ width: size, height: size }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
    >
      {isWord && variant}
    </motion.div>
  );
}
