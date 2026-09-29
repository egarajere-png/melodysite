"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, X, XCircle } from "lucide-react";

type ToastTone = "success" | "error";

interface ToastItem {
  id: number;
  tone: ToastTone;
  message: string;
}

interface ToastApi {
  success: (message: string) => void;
  error: (message: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const DISMISS_AFTER_MS = 4000;

/**
 * Top-right confirmation banners for admin operations. Mounted in the admin panel
 * layout, which persists across client-side navigation — so a form can fire a toast
 * and immediately router.push() away without the message being lost.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => setToasts((prev) => prev.filter((t) => t.id !== id)), []);

  const push = useCallback((tone: ToastTone, message: string) => {
    nextId.current += 1;
    const id = nextId.current;
    setToasts((prev) => [...prev, { id, tone, message }]);
  }, []);

  const [api] = useState<ToastApi>(() => ({
    success: (message) => push("success", message),
    error: (message) => push("error", message),
  }));

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-3 sm:right-6 sm:top-6">
        <AnimatePresence initial={false}>
          {toasts.map((t) => (
            <ToastCard key={t.id} toast={t} onDismiss={dismiss} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({ toast, onDismiss }: { toast: ToastItem; onDismiss: (id: number) => void }) {
  // onDismiss is a stable callback, so this timer is set once per toast rather than
  // restarting every time another toast is added or removed.
  useEffect(() => {
    const timer = window.setTimeout(() => onDismiss(toast.id), DISMISS_AFTER_MS);
    return () => window.clearTimeout(timer);
  }, [onDismiss, toast.id]);

  const Icon = toast.tone === "success" ? CheckCircle2 : XCircle;

  return (
    <motion.div
      layout
      role={toast.tone === "error" ? "alert" : "status"}
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className={`pointer-events-auto flex items-start gap-3 border-l-2 bg-white px-4 py-3 text-sm shadow-lg ${
        toast.tone === "success" ? "border-green-700" : "border-aurum-earth"
      }`}
    >
      <Icon size={18} strokeWidth={1.5} className={`mt-0.5 shrink-0 ${toast.tone === "success" ? "text-green-700" : "text-aurum-earth"}`} />
      <p className="flex-1 text-aurum-obsidian">{toast.message}</p>
      <button onClick={() => onDismiss(toast.id)} aria-label="Dismiss notification" className="shrink-0 text-aurum-obsidian/40 hover:text-aurum-obsidian">
        <X size={16} strokeWidth={1.5} />
      </button>
    </motion.div>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>.");
  return ctx;
}
