/** Branded loading placeholder for product grids — shown briefly while a client
 * component reading search params suspends. Respects prefers-reduced-motion via
 * the global animation-duration override in globals.css. */
export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div aria-hidden className="grid grid-cols-2 gap-x-5 gap-y-12 sm:gap-x-8 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex flex-col gap-4">
          <div className="aspect-[4/5] w-full animate-pulse bg-aurum-obsidian/[0.06]" />
          <div className="h-3 w-3/4 animate-pulse bg-aurum-obsidian/[0.06]" />
          <div className="h-3 w-1/4 animate-pulse bg-aurum-obsidian/[0.06]" />
        </div>
      ))}
    </div>
  );
}
