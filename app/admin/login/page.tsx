"use client";

import { FormEvent, Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function AdminLoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        setError("Incorrect email or password.");
        setSubmitting(false);
        return;
      }
      // A full navigation (not router.push) so the just-set session cookie is
      // definitely attached to the next request — the middleware re-checks staff
      // status there and bounces non-ADMIN/ASSISTANT accounts to "/".
      window.location.href = next;
    } catch {
      setError("Could not sign in right now. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-aurum-ivory px-6">
      <form onSubmit={handleSubmit} className="w-full max-w-sm border border-aurum-obsidian/10 bg-white p-8">
        <p className="font-display text-lg tracking-widest text-aurum-obsidian">AURUM</p>
        <p className="mb-6 text-[10px] uppercase tracking-[0.3em] text-aurum-obsidian/40">Admin Sign In</p>

        <label className="mb-1.5 block text-xs uppercase tracking-widest text-aurum-obsidian/50">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoFocus
          className="mb-4 w-full border border-aurum-obsidian/15 px-3 py-2.5 text-sm focus-visible:border-aurum-obsidian focus-visible:outline-none"
        />

        <label className="mb-1.5 block text-xs uppercase tracking-widest text-aurum-obsidian/50">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="mb-6 w-full border border-aurum-obsidian/15 px-3 py-2.5 text-sm focus-visible:border-aurum-obsidian focus-visible:outline-none"
        />

        {error && <p className="mb-4 text-sm text-aurum-earth">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-aurum-deep px-6 py-3 text-xs uppercase tracking-widest text-aurum-ivory transition-colors hover:bg-aurum-plum disabled:opacity-60"
        >
          {submitting ? "Signing in…" : "Sign In"}
        </button>
      </form>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <AdminLoginForm />
    </Suspense>
  );
}
