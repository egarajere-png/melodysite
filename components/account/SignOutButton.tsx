"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton({ className = "", children = "Sign Out" }: { className?: string; children?: React.ReactNode }) {
  const [busy, setBusy] = useState(false);
  async function signOut() {
    setBusy(true);
    await createClient().auth.signOut();
    // Full navigation so the server layout drops the cart/wishlist/account state.
    window.location.assign("/");
  }
  return (
    <button type="button" onClick={signOut} disabled={busy} className={className}>
      {busy ? "Signing out…" : children}
    </button>
  );
}
