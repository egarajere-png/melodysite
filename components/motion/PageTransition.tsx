"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { easeEditorial } from "@/lib/motion";

/**
 * Wraps route content so navigating between pages feels like turning a page of an editorial
 * rather than a hard cut: outgoing content settles back slightly while a panel sweeps across,
 * then the new route fades up from underneath it.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const reduce = useReducedMotion();

  if (reduce) return <>{children}</>;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.5, ease: easeEditorial }}
      >
        {children}
        <motion.div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-[var(--z-transition)] bg-aurum-deep"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 0 }}
          exit={{ scaleX: 1 }}
          transition={{ duration: 0.5, ease: easeEditorial }}
          style={{ transformOrigin: "right" }}
        />
      </motion.div>
    </AnimatePresence>
  );
}
