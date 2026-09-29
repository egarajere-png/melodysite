"use client";

import { useState } from "react";
import { GoogleAuthButton } from "@/components/account/GoogleAuthButton";
import { EmailAuthForm, type AuthMode } from "@/components/account/EmailAuthForm";

/** The signed-out /account view: Sign in / Create account tabs, Google, and email. */
export function AccountAuthPanel({ initialMode, next, authError }: { initialMode: AuthMode; next: string; authError?: string }) {
  const [mode, setMode] = useState<AuthMode>(initialMode);

  return (
    <div className="w-full max-w-md">
      {mode !== "reset" ? (
        <div role="tablist" aria-label="Account" className="mb-6 grid grid-cols-2 border-b border-aurum-obsidian/15">
          {(["signin", "signup"] as const).map((m) => (
            <button
              key={m}
              role="tab"
              aria-selected={mode === m}
              onClick={() => setMode(m)}
              className={`-mb-px border-b-2 pb-3 text-xs uppercase tracking-[0.2em] transition-colors ${
                mode === m ? "border-aurum-obsidian text-aurum-obsidian" : "border-transparent text-aurum-obsidian/45 hover:text-aurum-obsidian"
              }`}
            >
              {m === "signin" ? "Sign In" : "Create Account"}
            </button>
          ))}
        </div>
      ) : (
        <div className="mb-6">
          <p className="font-display text-2xl">Reset your password</p>
          <p className="mt-2 text-sm text-aurum-obsidian/60">Enter your email and we&apos;ll send you a link to choose a new one.</p>
        </div>
      )}

      {authError && (
        <p role="alert" className="mb-5 border-l-2 border-aurum-earth bg-white px-4 py-3 text-sm text-aurum-earth">
          {authError}
        </p>
      )}

      {mode !== "reset" && (
        <>
          <GoogleAuthButton next={next} />
          <div className="my-6 flex items-center gap-4 text-[10px] uppercase tracking-[0.3em] text-aurum-obsidian/40">
            <span className="h-px flex-1 bg-aurum-obsidian/15" />
            or with email
            <span className="h-px flex-1 bg-aurum-obsidian/15" />
          </div>
        </>
      )}

      <EmailAuthForm key={mode} mode={mode} next={next} onModeChange={setMode} />
    </div>
  );
}
