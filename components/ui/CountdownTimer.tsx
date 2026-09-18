"use client";

import { useEffect, useState } from "react";

function getRemaining(endsAt: string) {
  const diff = Math.max(0, new Date(endsAt).getTime() - Date.now());
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  return { days, hours, minutes };
}

export function CountdownTimer({ endsAt }: { endsAt: string }) {
  const [remaining, setRemaining] = useState<{ days: number; hours: number; minutes: number } | null>(null);

  useEffect(() => {
    // Computed from Date.now(), which must stay out of the initial render to
    // avoid a server/client hydration mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRemaining(getRemaining(endsAt));
    const id = setInterval(() => setRemaining(getRemaining(endsAt)), 60_000);
    return () => clearInterval(id);
  }, [endsAt]);

  if (!remaining) return null;

  return (
    <div className="flex items-center gap-4 text-sm" aria-live="polite">
      {[
        { label: "Days", value: remaining.days },
        { label: "Hours", value: remaining.hours },
        { label: "Mins", value: remaining.minutes },
      ].map((unit) => (
        <div key={unit.label} className="text-center">
          <span className="block font-display text-2xl tabular-nums sm:text-3xl">
            {String(unit.value).padStart(2, "0")}
          </span>
          <span className="text-[10px] uppercase tracking-widest text-current/50">{unit.label}</span>
        </div>
      ))}
    </div>
  );
}
