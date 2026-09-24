"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function GoogleAuthButton() {
  const [error, setError] = useState<string | null>(null);
  async function signIn() {
    setError(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/auth/callback?next=/account` } });
      if (error) setError("Google sign-in could not start. Please try again.");
    } catch { setError("Account sign-in is not configured yet."); }
  }
  return <><button type="button" onClick={signIn} className="inline-flex items-center bg-aurum-deep px-8 py-4 text-xs uppercase tracking-[0.2em] text-aurum-ivory transition-colors hover:bg-aurum-plum">Continue with Google</button>{error && <p className="mt-3 text-sm text-aurum-earth">{error}</p>}</>;
}
