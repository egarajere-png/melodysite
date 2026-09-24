"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import { X } from "lucide-react";
import { EditorialImage } from "@/components/ui/EditorialImage";
import type { Category, ImageRef } from "@/lib/types";
import { easeEditorial } from "@/lib/motion";

const MENU_ITEMS: { label: string; href: string; preview: ImageRef }[] = [
  { label: "Shop", href: "/shop", preview: { id: "menu-shop", alt: "Shop all", kind: "editorial", tone: "plum" } },
  { label: "About Aurum", href: "/about", preview: { id: "menu-about", alt: "About Aurum Entonet", kind: "editorial", tone: "obsidian" } },
  { label: "Contact", href: "/contact", preview: { id: "menu-contact", alt: "Contact Aurum Entonet", kind: "editorial", tone: "sand" } },
  { label: "New Arrivals", href: "/shop?sort=new", preview: { id: "menu-new", alt: "New arrivals", kind: "editorial", tone: "deep" } },
  { label: "Bestsellers", href: "/shop?sort=bestsellers", preview: { id: "menu-best", alt: "Bestsellers", kind: "editorial", tone: "earth" } },
  { label: "Deals", href: "/shop?deal=true", preview: { id: "menu-deals", alt: "The Aurum Edit", kind: "editorial", tone: "ivory" } },
];

export function MenuOverlay({
  open,
  onClose,
  categories,
}: {
  open: boolean;
  onClose: () => void;
  categories: Category[];
}) {
  const [hovered, setHovered] = useState<ImageRef | null>(null);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Site navigation"
          className="fixed inset-0 z-[var(--z-drawer)] flex bg-aurum-obsidian text-aurum-ivory"
          initial={{ clipPath: "inset(0 0 100% 0)" }}
          animate={{ clipPath: "inset(0 0 0% 0)" }}
          exit={{ clipPath: "inset(0 0 100% 0)" }}
          transition={{ duration: 0.6, ease: easeEditorial }}
        >
          <div className="relative flex w-full flex-col justify-between p-6 sm:p-10 md:w-3/5">
            <div className="flex items-center justify-between">
              <span className="font-display text-lg tracking-[0.25em]">AURUM ENTONET</span>
              <button onClick={onClose} aria-label="Close menu" data-cursor="expand" className="p-1">
                <X size={22} strokeWidth={1.5} />
              </button>
            </div>

            <nav className="flex flex-col gap-2 py-10">
              {MENU_ITEMS.map((item, i) => (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.15 + i * 0.06, ease: easeEditorial }}
                  onMouseEnter={() => setHovered(item.preview)}
                  onMouseLeave={() => setHovered(null)}
                >
                  <Link
                    href={item.href}
                    onClick={onClose}
                    data-cursor="view"
                    className="font-display text-4xl leading-tight transition-opacity hover:opacity-60 sm:text-6xl"
                  >
                    {item.label}
                  </Link>
                </motion.div>
              ))}
            </nav>

            <div className="border-t border-[var(--border-inverse)] pt-6">
              <p className="mb-4 text-[11px] uppercase tracking-[0.3em] text-aurum-ivory/50">Shop by Category</p>
              <div className="flex flex-wrap gap-x-6 gap-y-3">
                {categories.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/shop?category=${c.slug}`}
                    onClick={onClose}
                    data-cursor="shop"
                    className="text-xs uppercase tracking-widest text-aurum-ivory/70 transition-colors hover:text-aurum-ivory"
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-6 text-xs uppercase tracking-widest text-aurum-ivory/60">
              <a href="https://instagram.com" target="_blank" rel="noreferrer" className="hover:text-aurum-ivory">
                Instagram
              </a>
              <a href="https://wa.me/254700000000" target="_blank" rel="noreferrer" className="hover:text-aurum-ivory">
                WhatsApp
              </a>
              <Link href="/contact" onClick={onClose} className="hover:text-aurum-ivory">
                Contact
              </Link>
            </div>
          </div>

          <div className="relative hidden flex-1 md:block">
            <AnimatePresence mode="wait">
              {hovered && (
                <motion.div
                  key={hovered.id}
                  className="absolute inset-8"
                  initial={{ opacity: 0, scale: 1.04 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4, ease: easeEditorial }}
                >
                  <EditorialImage image={hovered} className="h-full w-full" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
