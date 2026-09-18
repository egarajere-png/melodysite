/** Branded route-transition fallback. Deliberately small and quiet — the cinematic
 * Preloader owns the first-visit moment; this only covers brief server-render gaps
 * on subsequent navigation and must never compete with it. */
export default function Loading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <p className="animate-pulse font-display text-xs uppercase tracking-[0.4em] text-aurum-obsidian/40">
        Aurum Entonet
      </p>
    </div>
  );
}
