"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import type { ImageRef } from "@/lib/types";
import { EditorialImage } from "@/components/ui/EditorialImage";

/** Image that drifts slightly slower/faster than scroll — used for editorial/storytelling sections. */
export function ParallaxImage({
  image,
  className = "",
  strength = 60,
  priority = false,
}: {
  image: ImageRef;
  className?: string;
  strength?: number;
  priority?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [-strength, strength]);

  return (
    // Only default to `relative` when the caller hasn't positioned it: in Tailwind v4
    // `relative` would override a caller's `absolute`, turning a full-bleed hero image
    // into a flex item squeezed beside the hero text.
    <div ref={ref} className={`${/\b(absolute|fixed)\b/.test(className) ? "" : "relative"} overflow-hidden ${className}`}>
      <motion.div className="absolute inset-[-10%]" style={reduce ? undefined : { y }}>
        <EditorialImage image={image} className="h-full w-full" priority={priority} />
      </motion.div>
    </div>
  );
}
