"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { authCallbackUrl, safeNextPath } from "@/lib/auth-redirect";

export type AuthMode = "signin" | "signup" | "reset";

const inputClasses = "w-full border border-aurum-obsidian/20 bg-white px-4 py-3 text-sm focus-visible:border-aurum-obsidian focus-visible:outline-none";
const labelClasses = "mb-1.5 block text-xs uppercase tracking-widest text-aurum-obsidian/50";

function friendlyError(message: string): string {
  if (/invalid login credentials/i.test(message)) return "Incorrect email or password.";
  if (/email not confirmed/i.test(message)) return "Please confirm your email first — check your inbox for the link we sent.";
  if (/already registered|already exists/i.test(message)) return "An account with this email already exists. Try signing in instead.";
  if (/rate limit|too many/i.test(message)) return "Too many attempts. Please wait a few minutes and try again.";
  if (/password/i.test(message)) return message;
  return "Something went wrong. Please try again.";
}

export function EmailAuthForm({ mode, next, onModeChange }: { mode: AuthMode; next: string; onModeChange: (mode: AuthMode) => void }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    const supabase = createClient();
    const destination = safeNextPath(next);

    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        // Full navigation so the server layout re-reads the new session cookie
        // (cart, wishlist and the navbar account menu all come from it).
        window.location.assign(destination);
        return;
      }

      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName.trim() }, emailRedirectTo: authCallbackUrl(window.location.origin, destination) },
        });
        if (error) throw error;
        if (data.session) {
          window.location.assign(destination);
          return;
        }
        setNotice(`Almost there — we've sent a confirmation link to ${email}. Open it on this device to finish creating your account.`);
        setPassword("");
      }

      if (mode === "reset") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: authCallbackUrl(window.location.origin, "/account/update-password") });
        if (error) throw error;
        setNotice(`If an account exists for ${email}, a link to reset your password is on its way.`);
      }
    } catch (err) {
      setError(friendlyError(err instanceof Error ? err.message : ""));
    }
    setBusy(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {mode === "signup" && (
        <div>
          <label htmlFor="auth-name" className={labelClasses}>Full name</label>
          <input id="auth-name" value={fullName} onChange={(e) => setFullName(e.target.value)} required autoComplete="name" className={inputClasses} />
        </div>
      )}
      <div>
        <label htmlFor="auth-email" className={labelClasses}>Email</label>
        <input id="auth-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" className={inputClasses} />
      </div>
      {mode !== "reset" && (
        <div>
          <div className="flex items-baseline justify-between">
            <label htmlFor="auth-password" className={labelClasses}>Password</label>
            {mode === "signin" && (
              <button type="button" onClick={() => onModeChange("reset")} className="text-xs text-aurum-obsidian/50 underline-offset-4 hover:text-aurum-obsidian hover:underline">
                Forgot password?
              </button>
            )}
          </div>
          <input
            id="auth-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={mode === "signup" ? 8 : undefined}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            className={inputClasses}
          />
          {mode === "signup" && <p className="mt-1 text-xs text-aurum-obsidian/40">At least 8 characters.</p>}
        </div>
      )}

      {error && <p role="alert" className="text-sm text-aurum-earth">{error}</p>}
      {notice && <p role="status" className="bg-aurum-ivory px-4 py-3 text-sm text-aurum-obsidian/80">{notice}</p>}

      <button
        type="submit"
        disabled={busy}
        className="bg-aurum-deep px-8 py-4 text-xs uppercase tracking-[0.2em] text-aurum-ivory transition-colors hover:bg-aurum-plum disabled:opacity-60"
      >
        {busy ? "Please wait…" : mode === "signin" ? "Sign In" : mode === "signup" ? "Create Account" : "Send Reset Link"}
      </button>

      {mode === "reset" && (
        <button type="button" onClick={() => onModeChange("signin")} className="text-xs uppercase tracking-widest text-aurum-obsidian/60 hover:text-aurum-obsidian">
          Back to sign in
        </button>
      )}
    </form>
  );
}
