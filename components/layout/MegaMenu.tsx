"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import { EditorialImage } from "@/components/ui/EditorialImage";
import { easeLuxury } from "@/lib/motion";
import type { Category, ImageRef } from "@/lib/types";

const QUICK_LINKS = [
  { label: "New Arrivals", href: "/shop?sort=new" },
  { label: "Bestsellers", href: "/shop?sort=bestsellers" },
  { label: "The Aurum Edit", href: "/shop?deal=true" },
];

/**
 * Desktop pop-down anchored under the "Shop" nav item. Hover/focus-driven, closes on
 * mouse leave, Escape, or navigation. Never used on mobile — MenuOverlay carries the
 * equivalent category list there.
 */
export function MegaMenu({
  open,
  onClose,
  categories,
}: {
  open: boolean;
  onClose: () => void;
  categories: Category[];
}) {
  const [hovered, setHovered] = useState<ImageRef | null>(categories[0]?.image ?? null);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="menu"
          aria-label="Shop categories"
          onMouseLeave={onClose}
          onKeyDown={(e) => e.key === "Escape" && onClose()}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.35, ease: easeLuxury }}
          className="absolute inset-x-0 top-full hidden border-t border-[var(--border-subtle)] bg-aurum-ivory text-aurum-obsidian shadow-[var(--shadow-float)] md:block"
        >
          <div className="container-aurum grid grid-cols-[1.1fr_1fr] gap-16 py-12">
            <div>
              <p className="mb-6 text-[11px] uppercase tracking-[0.3em] text-aurum-obsidian/50">
                Shop by Category
              </p>
              <ul className="grid grid-cols-2 gap-x-8 gap-y-4">
                {categories.map((c) => (
                  <li key={c.slug}>
                    <Link
                      href={`/shop?category=${c.slug}`}
                      data-cursor="shop"
                      onMouseEnter={() => setHovered(c.image)}
                      onFocus={() => setHovered(c.image)}
                      onClick={onClose}
                      className="font-display text-2xl leading-tight transition-opacity hover:opacity-60"
                    >
                      {c.name}
                    </Link>
                  </li>
                ))}
              </ul>

              <div className="mt-10 flex flex-wrap gap-x-8 gap-y-2 border-t border-[var(--border-subtle)] pt-6 text-xs uppercase tracking-widest">
                {QUICK_LINKS.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={onClose}
                    className="text-aurum-obsidian/70 transition-colors hover:text-aurum-obsidian"
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="relative aspect-[4/3] w-full overflow-hidden">
              <AnimatePresence mode="wait">
                {hovered && (
                  <motion.div
                    key={hovered.id}
                    className="absolute inset-0"
                    initial={{ opacity: 0, scale: 1.03 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4, ease: easeLuxury }}
                  >
                    <EditorialImage image={hovered} className="h-full w-full" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
