"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Search, ShoppingBag } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useCart } from "@/context/CartContext";
import { MegaMenu } from "@/components/layout/MegaMenu";
import { UserMenu, type NavAccount } from "@/components/layout/UserMenu";
import type { Category } from "@/lib/types";
import { usePreloaderReady } from "@/lib/usePreloaderReady";

const NAV_LINKS = [
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function Navbar({ onOpenMenu, categories, account }: { onOpenMenu: () => void; categories: Category[]; account: NavAccount | null }) {
  const pathname = usePathname();
  const { count, openCart } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // After "Shop" itself is clicked the pointer is still over it — without this the
  // menu would reopen immediately. Cleared once the pointer leaves the Shop area.
  const suppressOpen = useRef(false);
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
    if (suppressOpen.current) return;
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setShopOpen(true);
  }
  function scheduleCloseShop() {
    suppressOpen.current = false;
    closeTimer.current = setTimeout(() => setShopOpen(false), 120);
  }
  // Clicking "Shop" navigates, so close the menu the same way a category click does.
  function handleShopClick() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    suppressOpen.current = true;
    setShopOpen(false);
  }

  const transparent = isHome && !scrolled && !shopOpen;
  // Held back (via data-intro-hold in preloader.css) while the invitation is up, then
  // fades in last — after the Hero's one-by-one entrance on the homepage.
  const { fromIntro } = usePreloaderReady();
  const introStyle = fromIntro
    ? {
        opacity: 1,
        transition: `opacity 1.2s var(--ease-luxury) ${isHome ? 2.9 : 0.3}s, background-color 500ms, border-color 500ms`,
      }
    : undefined;

  return (
    <header
      data-intro-hold
      style={introStyle}
      className={`fixed inset-x-0 top-0 z-[var(--z-nav)] transition-colors duration-500 ${
        transparent ? "bg-transparent" : "border-b border-[var(--border-subtle)] bg-aurum-ivory/95 backdrop-blur-sm"
      }`}
    >
      <div
        className={`container-aurum grid h-20 grid-cols-[1fr_auto_1fr] items-center gap-3 transition-colors duration-500 ${
          transparent ? "text-aurum-ivory" : "text-aurum-obsidian"
        }`}
      >
        <button
          onClick={onOpenMenu}
          aria-label="Open menu"
          data-cursor="open"
          className="flex items-center gap-2 justify-self-start text-xs uppercase tracking-widest"
        >
          <Menu size={18} strokeWidth={1.5} />
          <span className="hidden sm:inline">Menu</span>
        </button>

        <Link
          href="/"
          data-cursor="expand"
          className="whitespace-nowrap font-display text-[13px] tracking-[0.18em] min-[400px]:text-base min-[400px]:tracking-[0.25em] sm:text-xl"
        >
          AURUM ENTONET
        </Link>

        <div className="flex items-center gap-3 justify-self-end sm:gap-5">
          <nav className="hidden items-center gap-7 text-xs uppercase tracking-widest md:flex">
            <div onMouseEnter={openShop} onMouseLeave={scheduleCloseShop}>
              <Link
                href="/shop"
                data-cursor="shop"
                onFocus={openShop}
                onClick={handleShopClick}
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
          <UserMenu account={account} />
          <button
            onClick={openCart}
            aria-label={`Open bag, ${count} item${count === 1 ? "" : "s"}`}
            className="relative flex h-8 w-8 items-center justify-center"
            data-cursor="expand"
          >
            <ShoppingBag size={18} strokeWidth={1.5} />
            {count > 0 && (
              <span className="absolute -right-1 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-aurum-gold text-[9px] font-medium text-aurum-obsidian">
                {count}
              </span>
            )}
          </button>
        </div>
      </div>

      <div onMouseEnter={openShop} onMouseLeave={scheduleCloseShop}>
        <MegaMenu open={shopOpen} onClose={() => setShopOpen(false)} categories={categories} />
      </div>
    </header>
  );
}
