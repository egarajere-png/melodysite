"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { EditorialImage } from "@/components/ui/EditorialImage";
import { GoogleAuthButton } from "@/components/account/GoogleAuthButton";
import { formatKES } from "@/lib/format";
import { easeSoft } from "@/lib/motion";

export function CartDrawer() {
  const { lines, isOpen, closeCart, updateQuantity, removeLine, subtotal, signInRequired, error } = useCart();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-[var(--z-drawer)] bg-aurum-obsidian/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            aria-hidden
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label="Shopping bag"
            className="fixed right-0 top-0 z-[var(--z-drawer)] flex h-dvh w-full max-w-md flex-col bg-aurum-ivory text-aurum-obsidian shadow-[var(--shadow-float)]"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.5, ease: easeSoft }}
          >
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-6 py-5">
              <h2 className="font-display text-xl">Your Bag</h2>
              <button
                onClick={closeCart}
                aria-label="Close bag"
                className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-black/5"
              >
                ✕
              </button>
            </div>

            {error && <p className="px-6 pt-4 text-sm text-aurum-earth">{error}</p>}

            {signInRequired ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 text-center">
                <p className="font-display text-xl">Sign in to start your bag.</p>
                <p className="max-w-xs text-sm text-aurum-obsidian/60">
                  Your bag is saved to your account, so it&apos;s there whenever you come back.
                </p>
                <GoogleAuthButton />
              </div>
            ) : lines.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
                <p className="text-sm uppercase tracking-widest text-aurum-obsidian/60">Your bag is empty</p>
                <Link
                  href="/shop"
                  onClick={closeCart}
                  className="font-display text-lg underline underline-offset-4"
                >
                  Continue shopping
                </Link>
              </div>
            ) : (
              <ul className="flex-1 overflow-y-auto px-6">
                {lines.map((line) => (
                  <li key={line.variantId} className="flex gap-4 border-b border-[var(--border-subtle)] py-5">
                    <EditorialImage image={line.image} className="h-24 w-20 shrink-0 rounded-sm" />
                    <div className="flex flex-1 flex-col justify-between">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-display text-base leading-tight">{line.name}</p>
                          <p className="mt-1 text-xs uppercase tracking-wide text-aurum-obsidian/60">
                            {line.variantLabel}
                          </p>
                        </div>
                        <p className="whitespace-nowrap text-sm">{formatKES(line.unitPrice)}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-sm">
                          <button
                            aria-label={`Decrease quantity of ${line.name}`}
                            onClick={() => updateQuantity(line.variantId, line.quantity - 1)}
                            className="flex h-7 w-7 items-center justify-center border border-[var(--border-strong)] transition-colors hover:bg-black/5"
                          >
                            −
                          </button>
                          <span aria-live="polite">{line.quantity}</span>
                          <button
                            aria-label={`Increase quantity of ${line.name}`}
                            onClick={() => updateQuantity(line.variantId, line.quantity + 1)}
                            disabled={line.quantity >= line.maxStock}
                            className="flex h-7 w-7 items-center justify-center border border-[var(--border-strong)] transition-colors hover:bg-black/5 disabled:opacity-30"
                          >
                            +
                          </button>
                        </div>
                        <button
                          onClick={() => removeLine(line.variantId)}
                          className="text-xs uppercase tracking-wide text-aurum-obsidian/50 underline-offset-4 hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {lines.length > 0 && (
              <div className="border-t border-[var(--border-subtle)] px-6 py-6">
                <div className="mb-4 flex items-center justify-between font-display text-lg">
                  <span>Subtotal</span>
                  <span>{formatKES(subtotal)}</span>
                </div>
                <Link
                  href="/checkout"
                  onClick={closeCart}
                  className="flex w-full items-center justify-center bg-aurum-deep px-6 py-4 text-sm uppercase tracking-[0.2em] text-aurum-ivory transition-colors hover:bg-aurum-plum"
                >
                  Checkout
                </Link>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
