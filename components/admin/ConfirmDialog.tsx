"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

/** Modal confirmation for destructive admin actions (deletes, removals). */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  busy = false,
  onConfirm,
  onCancel,
  confirmDisabled = false,
  children,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  /** Extra guard on the confirm button, e.g. until a required choice in `children` is made. */
  confirmDisabled?: boolean;
  /** Optional extra content (e.g. a "move products to" picker) shown under the message. */
  children?: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !busy) onCancel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, busy, onCancel]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-aurum-obsidian/40 px-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => !busy && onCancel()}
        >
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white p-6 shadow-xl"
          >
            <h2 id="confirm-dialog-title" className="font-display text-xl">
              {title}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-aurum-obsidian/70">{message}</p>
            {children && <div className="mt-4">{children}</div>}
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={onCancel}
                disabled={busy}
                className="px-4 py-2.5 text-xs uppercase tracking-widest text-aurum-obsidian/60 hover:text-aurum-obsidian disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={busy || confirmDisabled}
                autoFocus
                className="bg-aurum-earth px-5 py-2.5 text-xs uppercase tracking-widest text-aurum-ivory transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {busy ? "Working…" : confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
