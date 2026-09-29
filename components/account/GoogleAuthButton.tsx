"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { authCallbackUrl } from "@/lib/auth-redirect";

async function isGoogleEnabled(): Promise<boolean> {
  // Public, anon-key endpoint. Checking first means a visitor gets a clear message
  // instead of being bounced to Supabase's raw "provider is not enabled" JSON page.
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/settings`, {
      headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! },
    });
    if (!res.ok) return true; // unknown — let Supabase decide
    const settings = (await res.json()) as { external?: { google?: boolean } };
    return settings.external?.google !== false;
  } catch {
    return true;
  }
}

export function GoogleAuthButton({ next, className = "" }: { next?: string; className?: string }) {
  const pathname = usePathname();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function signIn() {
    setError(null);
    setBusy(true);
    try {
      if (!(await isGoogleEnabled())) {
        setError("Google sign-in isn't available yet — please use your email for now.");
        setBusy(false);
        return;
      }
      const supabase = createClient();
      const destination = next ?? (pathname && !pathname.startsWith("/account") ? pathname : "/account");
      const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: authCallbackUrl(window.location.origin, destination) } });
      if (error) {
        setError("Google sign-in could not start. Please try again.");
        setBusy(false);
      }
      // On success the browser is already navigating to Google.
    } catch {
      setError("Account sign-in is not configured yet.");
      setBusy(false);
    }
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={signIn}
        disabled={busy}
        className="flex w-full items-center justify-center gap-3 border border-aurum-obsidian/25 bg-white px-8 py-4 text-xs uppercase tracking-[0.2em] text-aurum-obsidian transition-colors hover:border-aurum-obsidian disabled:opacity-60"
      >
        <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4">
          <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.8z" />
          <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24z" />
          <path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.3a12 12 0 0 0 0 10.8l4-3.1z" />
          <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1c.9-2.9 3.6-4.9 6.7-4.9z" />
        </svg>
        {busy ? "Connecting…" : "Continue with Google"}
      </button>
      {error && <p className="mt-3 text-sm text-aurum-earth">{error}</p>}
    </div>
  );
}
