"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import type { ImageRef } from "@/lib/types";
import { EditorialImage } from "@/components/ui/EditorialImage";

/**
 * Crossfades from a product image to its worn/model image on hover (desktop) or tap (touch).
 * This is the core Aurum product-card interaction.
 */
export function HoverImageSwap({
  primary,
  secondary,
  className = "",
}: {
  primary: ImageRef;
  secondary?: ImageRef;
  className?: string;
}) {
  const [active, setActive] = useState(false);

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      onMouseEnter={() => secondary && setActive(true)}
      onMouseLeave={() => setActive(false)}
      onTouchStart={() => secondary && setActive((v) => !v)}
    >
      <EditorialImage image={primary} className="h-full w-full transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]" />
      <AnimatePresence>
        {active && secondary && (
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <EditorialImage image={secondary} className="h-full w-full" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
