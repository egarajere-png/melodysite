"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Heart, LogIn, Package, User, UserPlus } from "lucide-react";
import { SignOutButton } from "@/components/account/SignOutButton";
import { useWishlist } from "@/context/WishlistContext";
import { easeLuxury } from "@/lib/motion";

export interface NavAccount {
  name: string | null;
  email: string | null;
}

const itemClasses = "flex items-center gap-3 px-4 py-2.5 text-xs uppercase tracking-widest text-aurum-obsidian/75 transition-colors hover:bg-aurum-obsidian/5 hover:text-aurum-obsidian";

/**
 * Account icon in the navbar. With a mouse it opens on hover; on touch screens (no
 * hover) a tap toggles it; keyboard users open it with Enter/Space and close with Esc.
 */
export function UserMenu({ account }: { account: NavAccount | null }) {
  const pathname = usePathname();
  const wishlistCount = useWishlist().productIds.size;
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  const here = pathname && !pathname.startsWith("/account") ? `&next=${encodeURIComponent(pathname)}` : "";

  function show() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  }
  function hideSoon() {
    closeTimer.current = setTimeout(() => setOpen(false), 150);
  }

  // Close on outside tap/click and on Escape.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div
      ref={rootRef}
      className="relative"
      onPointerEnter={(e) => e.pointerType === "mouse" && show()}
      onPointerLeave={(e) => e.pointerType === "mouse" && hideSoon()}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={account ? "Account menu" : "Sign in or create an account"}
        aria-expanded={open}
        aria-controls={menuId}
        aria-haspopup="menu"
        data-cursor="expand"
        className="relative flex h-8 w-8 items-center justify-center"
      >
        <User size={18} strokeWidth={1.5} />
        {account && <span aria-hidden className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-aurum-gold" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            id={menuId}
            role="menu"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25, ease: easeLuxury }}
            // pt-3 is an invisible bridge so the pointer can travel from the icon to
            // the panel without leaving the hover area.
            className="absolute -right-3 top-full z-[var(--z-nav)] w-60 pt-3 text-aurum-obsidian"
          >
            <div className="border border-[var(--border-subtle)] bg-aurum-ivory py-2 shadow-[var(--shadow-float)]">
              {account ? (
                <>
                  <div className="border-b border-[var(--border-subtle)] px-4 pb-3 pt-2">
                    <p className="truncate font-display text-base normal-case tracking-normal">{account.name ? `Hi, ${account.name.split(" ")[0]}` : "Your account"}</p>
                    {account.email && <p className="truncate text-xs normal-case tracking-normal text-aurum-obsidian/50">{account.email}</p>}
                  </div>
                  <Link href="/account" role="menuitem" onClick={close} className={itemClasses}>
                    <User size={15} strokeWidth={1.5} /> My Account
                  </Link>
                  <Link href="/orders" role="menuitem" onClick={close} className={itemClasses}>
                    <Package size={15} strokeWidth={1.5} /> My Orders
                  </Link>
                  <Link href="/wishlist" role="menuitem" onClick={close} className={itemClasses}>
                    <Heart size={15} strokeWidth={1.5} /> Wishlist
                    {wishlistCount > 0 && <span className="ml-auto text-aurum-obsidian/40">{wishlistCount}</span>}
                  </Link>
                  <div className="mt-1 border-t border-[var(--border-subtle)] pt-1">
                    <SignOutButton className={`${itemClasses} w-full`} />
                  </div>
                </>
              ) : (
                <>
                  <Link href={`/account?mode=signin${here}`} role="menuitem" onClick={close} className={itemClasses}>
                    <LogIn size={15} strokeWidth={1.5} /> Sign In
                  </Link>
                  <Link href={`/account?mode=signup${here}`} role="menuitem" onClick={close} className={itemClasses}>
                    <UserPlus size={15} strokeWidth={1.5} /> Create Account
                  </Link>
                  <Link href="/wishlist" role="menuitem" onClick={close} className={`${itemClasses} mt-1 border-t border-[var(--border-subtle)] pt-3`}>
                    <Heart size={15} strokeWidth={1.5} /> View Wishlist
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

