"use client";

import { AnimatePresence, motion } from "framer-motion";
import { GoogleAuthButton } from "@/components/account/GoogleAuthButton";
import { easeSoft } from "@/lib/motion";

/** Shared modal used wherever an action (wishlist today) requires an account but the
 * visitor isn't signed in. Cart has its own inline drawer state for this since it's
 * always opening the drawer anyway — this covers everywhere else. */
export function SignInPrompt({
  open,
  onClose,
  title = "Sign in to continue.",
  description = "Your account keeps this saved for next time.",
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[var(--z-drawer)] bg-aurum-obsidian/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Sign in"
            className="fixed left-1/2 top-1/2 z-[var(--z-drawer)] w-[calc(100%-3rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 bg-aurum-ivory p-8 text-center shadow-[var(--shadow-float)]"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.3, ease: easeSoft }}
          >
            <p className="font-display text-xl">{title}</p>
            <p className="mt-3 text-sm text-aurum-obsidian/60">{description}</p>
            <div className="mt-6 flex justify-center">
              <GoogleAuthButton />
            </div>
            <button
              onClick={onClose}
              className="mt-4 text-xs uppercase tracking-widest text-aurum-obsidian/50 transition-colors hover:text-aurum-obsidian"
            >
              Not now
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
