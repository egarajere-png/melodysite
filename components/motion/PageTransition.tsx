"use client";

import { motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { easeLuxury } from "@/lib/motion";

/**
 * App Router owns route data and scroll restoration. Keep the route wrapper
 * lightweight: animate only the arriving page and never wait for the outgoing
 * page to finish before mounting it.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const reduce = useReducedMotion();

  if (reduce) return <>{children}</>;

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: easeLuxury }}
    >
      {children}
    </motion.div>
  );
}
