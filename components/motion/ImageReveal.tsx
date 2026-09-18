"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { easeLuxury, viewportOnce } from "@/lib/motion";

/** Curtain/mask reveal for large editorial imagery entering the viewport. */
export function ImageReveal({ children, className = "" }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion();

  if (reduce) return <div className={className}>{children}</div>;

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <motion.div
        initial={{ scale: 1.15 }}
        whileInView={{ scale: 1 }}
        viewport={viewportOnce}
        transition={{ duration: 1.1, ease: easeLuxury }}
        className="h-full w-full"
      >
        {children}
      </motion.div>
      <motion.div
        aria-hidden
        className="absolute inset-0 z-10 bg-aurum-ivory"
        initial={{ scaleX: 1 }}
        whileInView={{ scaleX: 0 }}
        viewport={viewportOnce}
        transition={{ duration: 0.9, ease: easeLuxury }}
        style={{ transformOrigin: "right" }}
      />
    </div>
  );
}
