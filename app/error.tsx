"use client";

import Link from "next/link";
import { useEffect } from "react";

/** Root error boundary — catches uncaught render errors below the layout and shows a
 * branded message instead of a raw stack trace. Logging is a placeholder until a real
 * error-reporting service is wired in. */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6 bg-aurum-obsidian px-6 text-center text-aurum-ivory">
      <p className="text-xs uppercase tracking-[0.3em] text-aurum-ivory/50">Something went sideways</p>
      <h1 className="max-w-lg font-display text-3xl leading-tight sm:text-5xl">
        This piece needs a moment to settle.
      </h1>
      <p className="max-w-sm text-sm text-aurum-ivory/60">
        Please try again, or return to the collection while we sort this out.
      </p>
      <div className="mt-2 flex flex-wrap justify-center gap-4">
        <button
          onClick={reset}
          className="inline-flex items-center bg-aurum-ivory px-8 py-4 text-xs uppercase tracking-[0.2em] text-aurum-obsidian transition-colors hover:bg-aurum-gold"
        >
          Try Again
        </button>
        <Link
          href="/"
          className="inline-flex items-center border border-aurum-ivory/40 px-8 py-4 text-xs uppercase tracking-[0.2em] transition-colors hover:border-aurum-ivory"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}
