"use client";

import { motion, useReducedMotion } from "framer-motion";
import { easeLuxury, viewportOnce } from "@/lib/motion";

/** Splits text into words and reveals them with a staggered clip/translate — used for large headings. */
export function RevealText({
  text,
  as: Tag = "h2",
  className,
  delay = 0,
  wordDelay = 0.05,
}: {
  text: string;
  as?: "h1" | "h2" | "h3" | "p";
  className?: string;
  delay?: number;
  wordDelay?: number;
}) {
  const reduce = useReducedMotion();
  const words = text.split(" ");

  if (reduce) {
    return <Tag className={className}>{text}</Tag>;
  }

  return (
    <Tag className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden className="inline">
        {words.map((word, i) => (
          <span key={i} className="inline-block overflow-hidden align-bottom">
            <motion.span
              className="inline-block"
              initial={{ y: "110%" }}
              whileInView={{ y: "0%" }}
              viewport={viewportOnce}
              transition={{ duration: 0.8, delay: delay + i * wordDelay, ease: easeLuxury }}
            >
              {word}
              {i < words.length - 1 ? " " : ""}
            </motion.span>
          </span>
        ))}
      </span>
    </Tag>
  );
}
