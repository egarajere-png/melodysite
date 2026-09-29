"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GoogleAuthButton } from "@/components/account/GoogleAuthButton";

/** Compact sign-in block for places that need an account (bag, checkout, wishlist):
 * Google in one tap, or email via the full /account page — returning here after. */
export function AuthOptions({ next, onNavigate }: { next?: string; onNavigate?: () => void }) {
  const pathname = usePathname();
  const back = next ?? pathname ?? "/account";
  return (
    <div className="flex w-full max-w-xs flex-col items-stretch gap-3">
      <GoogleAuthButton next={back} />
      <Link
        href={`/account?next=${encodeURIComponent(back)}`}
        onClick={onNavigate}
        className="bg-aurum-deep px-8 py-4 text-center text-xs uppercase tracking-[0.2em] text-aurum-ivory transition-colors hover:bg-aurum-plum"
      >
        Sign in with email
      </Link>
      <Link href={`/account?mode=signup&next=${encodeURIComponent(back)}`} onClick={onNavigate} className="text-center text-xs uppercase tracking-widest text-aurum-obsidian/60 underline-offset-4 hover:text-aurum-obsidian hover:underline">
        New here? Create an account
      </Link>
    </div>
  );
}
