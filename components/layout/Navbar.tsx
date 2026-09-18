"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Search, ShoppingBag, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useCart } from "@/context/CartContext";
import { MegaMenu } from "@/components/layout/MegaMenu";

const NAV_LINKS = [
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function Navbar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const pathname = usePathname();
  const { count, openCart } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isHome = pathname === "/";

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 60);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function openShop() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setShopOpen(true);
  }
  function scheduleCloseShop() {
    closeTimer.current = setTimeout(() => setShopOpen(false), 120);
  }

  const transparent = isHome && !scrolled && !shopOpen;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-[var(--z-nav)] transition-colors duration-500 ${
        transparent ? "bg-transparent" : "border-b border-[var(--border-subtle)] bg-aurum-ivory/95 backdrop-blur-sm"
      }`}
    >
      <div
        className={`container-aurum flex h-20 items-center justify-between transition-colors duration-500 ${
          transparent ? "text-aurum-ivory" : "text-aurum-obsidian"
        }`}
      >
        <button
          onClick={onOpenMenu}
          aria-label="Open menu"
          data-cursor="open"
          className="flex items-center gap-2 text-xs uppercase tracking-widest"
        >
          <Menu size={18} strokeWidth={1.5} />
          <span className="hidden sm:inline">Menu</span>
        </button>

        <Link
          href="/"
          data-cursor="expand"
          className="font-display text-base tracking-[0.25em] sm:text-xl"
        >
          AURUM ENTONET
        </Link>

        <div className="flex items-center gap-5">
          <nav className="hidden items-center gap-7 text-xs uppercase tracking-widest md:flex">
            <div onMouseEnter={openShop} onMouseLeave={scheduleCloseShop}>
              <Link
                href="/shop"
                data-cursor="shop"
                onFocus={openShop}
                aria-expanded={shopOpen}
                aria-haspopup="true"
                className="transition-opacity hover:opacity-60"
              >
                Shop
              </Link>
            </div>
            {NAV_LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="transition-opacity hover:opacity-60">
                {l.label}
              </Link>
            ))}
          </nav>
          <button aria-label="Search" className="hidden sm:block" data-cursor="expand">
            <Search size={18} strokeWidth={1.5} />
          </button>
          <Link href="/account" aria-label="Account" className="hidden sm:block" data-cursor="expand">
            <User size={18} strokeWidth={1.5} />
          </Link>
          <button
            onClick={openCart}
            aria-label={`Open bag, ${count} item${count === 1 ? "" : "s"}`}
            className="relative"
            data-cursor="expand"
          >
            <ShoppingBag size={18} strokeWidth={1.5} />
            {count > 0 && (
              <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-aurum-gold text-[9px] font-medium text-aurum-obsidian">
                {count}
              </span>
            )}
          </button>
        </div>
      </div>

      <div onMouseEnter={openShop} onMouseLeave={scheduleCloseShop}>
        <MegaMenu open={shopOpen} onClose={() => setShopOpen(false)} />
      </div>
    </header>
  );
}
