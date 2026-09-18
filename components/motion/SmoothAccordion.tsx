"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useId, useState, type ReactNode } from "react";
import { easeSoft } from "@/lib/motion";

export function AccordionItem({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();

  return (
    <div className="border-b border-[var(--border-subtle)]">
      <button
        id={`accordion-trigger-${id}`}
        aria-expanded={open}
        aria-controls={`accordion-panel-${id}`}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between py-4 text-left text-sm tracking-wide uppercase focus-visible:outline-offset-4"
      >
        <span>{title}</span>
        <motion.span
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.3, ease: easeSoft }}
          className="text-lg leading-none"
          aria-hidden
        >
          +
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={`accordion-panel-${id}`}
            role="region"
            aria-labelledby={`accordion-trigger-${id}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: easeSoft }}
            className="overflow-hidden"
          >
            <div className="pb-5 text-sm leading-relaxed text-current/80">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
