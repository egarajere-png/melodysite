"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

/** Reached from a password-reset email: /auth/callback has already signed the visitor
 * in with the one-time link, so this only needs to set the new password. */
export function UpdatePasswordForm() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("The two passwords don't match.");
      return;
    }
    setBusy(true);
    setError(null);
    const { error } = await createClient().auth.updateUser({ password });
    if (error) {
      setError(/session/i.test(error.message) ? "This reset link has expired. Please request a new one." : error.message);
      setBusy(false);
      return;
    }
    window.location.assign("/account");
  }

  const input = "w-full border border-aurum-obsidian/20 bg-white px-4 py-3 text-sm focus-visible:border-aurum-obsidian focus-visible:outline-none";
  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className="block">
        <span className="mb-1.5 block text-xs uppercase tracking-widest text-aurum-obsidian/50">New password</span>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required autoComplete="new-password" className={input} />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-xs uppercase tracking-widest text-aurum-obsidian/50">Confirm new password</span>
        <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} minLength={8} required autoComplete="new-password" className={input} />
      </label>
      {error && (
        <p role="alert" className="text-sm text-aurum-earth">
          {error} {/expired/.test(error) && <Link href="/account" className="underline">Back to sign in</Link>}
        </p>
      )}
      <button type="submit" disabled={busy} className="bg-aurum-deep px-8 py-4 text-xs uppercase tracking-[0.2em] text-aurum-ivory transition-colors hover:bg-aurum-plum disabled:opacity-60">
        {busy ? "Saving…" : "Save New Password"}
      </button>
    </form>
  );
}
