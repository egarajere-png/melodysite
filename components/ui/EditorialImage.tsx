import type { ImageRef } from "@/lib/types";

/**
 * Renders an abstract, editorial placeholder in place of real Aurum photography.
 * Driven entirely by the `image` data prop, so swapping in real product/worn/editorial
 * photography later is a data change (point this at a real <img>/<Image> source),
 * not a component rewrite.
 *
 * Every visible trait (gradient angle, motif variant, vignette) is derived from a
 * deterministic hash of `image.id`, so the same tone never renders identically twice —
 * the site doesn't read as three shapes recolored six ways.
 */

const TONE_BASE: Record<NonNullable<ImageRef["tone"]>, [string, string, string]> = {
  ivory: ["#f7f1e8", "#efe7d9", "#e4d8c4"],
  deep: ["#2f1a45", "#241338", "#170b24"],
  plum: ["#4a2560", "#3b1d4f", "#241338"],
  sand: ["#e4d8c4", "#d7c1a3", "#c6a15b"],
  obsidian: ["#201a24", "#09070b", "#000000"],
  earth: ["#6e4a36", "#5a3a2a", "#3a241a"],
};

const LIGHT_TONES = new Set(["ivory", "sand"]);

function hashString(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

/** Four hand-drawn-feeling jewellery silhouettes, picked deterministically per image id. */
function ProductMotif({ variant }: { variant: number }) {
  switch (variant % 4) {
    case 0: // ring — band + facet
      return (
        <>
          <circle cx="50" cy="54" r="22" fill="none" strokeWidth="0.6" className="stroke-current opacity-40" />
          <path d="M 42 33 L 50 24 L 58 33 Z" fill="none" strokeWidth="0.6" className="stroke-current opacity-40" />
        </>
      );
    case 1: // pendant drop
      return (
        <>
          <circle cx="50" cy="30" r="6" fill="none" strokeWidth="0.6" className="stroke-current opacity-40" />
          <path d="M 50 36 L 50 58 Q 50 74 50 74" fill="none" strokeWidth="0.6" className="stroke-current opacity-40" />
          <circle cx="50" cy="78" r="9" fill="none" strokeWidth="0.6" className="stroke-current opacity-40" />
        </>
      );
    case 2: // stud + hoop pair (earrings)
      return (
        <>
          <circle cx="36" cy="40" r="4.5" className="fill-current opacity-40" />
          <circle cx="64" cy="40" r="16" fill="none" strokeWidth="0.6" className="stroke-current opacity-40" />
        </>
      );
    default: // chain links
      return (
        <>
          <ellipse cx="42" cy="46" rx="13" ry="9" fill="none" strokeWidth="0.6" className="stroke-current opacity-40" />
          <ellipse cx="60" cy="58" rx="13" ry="9" fill="none" strokeWidth="0.6" className="stroke-current opacity-40" />
        </>
      );
  }
}

/** Worn-on-body suggestion — a soft curve standing in for a neckline, wrist or hand,
 *  with the curve's control points nudged per image id so no two feel identical. */
function WornMotif({ seed }: { seed: number }) {
  const lift = 24 + (seed % 18); // 24–41
  const width = 30 + (seed % 12); // 30–41
  return (
    <path
      d={`M ${50 - width} 80 Q 50 ${80 - lift} ${50 + width} 80`}
      fill="none"
      strokeWidth="0.6"
      className="stroke-current opacity-40"
    />
  );
}

/** Editorial imagery gets a faint architectural rhythm — evenly spaced hairlines,
 *  a nod to woven/structural pattern without literal motif-borrowing — plus one
 *  accent mark whose position shifts per image id. */
function EditorialMotif({ seed }: { seed: number }) {
  const angle = 8 + (seed % 20); // 8–27deg diagonal
  const dotX = 20 + (seed % 60);
  const dotY = 20 + ((seed >> 3) % 60);
  const lines = Array.from({ length: 5 }, (_, i) => 14 + i * 18);
  return (
    <>
      {lines.map((pos, i) => (
        <line
          key={pos}
          x1={pos}
          y1="0"
          x2={pos - angle}
          y2="100"
          strokeWidth="0.3"
          className="stroke-current opacity-[0.12]"
          style={{ opacity: i === 2 ? 0.22 : undefined }}
        />
      ))}
      <circle cx={dotX} cy={dotY} r="1.4" className="fill-current opacity-60" />
    </>
  );
}

function Motif({ kind, seed }: { kind: NonNullable<ImageRef["kind"]>; seed: number }) {
  if (kind === "product") return <ProductMotif variant={seed} />;
  if (kind === "worn") return <WornMotif seed={seed} />;
  return <EditorialMotif seed={seed} />;
}

export function EditorialImage({
  image,
  className = "",
  priority = false,
}: {
  image: ImageRef;
  className?: string;
  priority?: boolean;
}) {
  void priority; // reserved for when real <Image> sources replace this placeholder
  const tone = image.tone ?? "sand";
  const kind = image.kind ?? "editorial";
  const isLight = LIGHT_TONES.has(tone);
  const seed = hashString(image.id);

  const [from, mid, to] = TONE_BASE[tone];
  const angle = 130 + (seed % 50); // 130–179deg — every id gets its own light direction
  const gradient = `linear-gradient(${angle}deg, ${from} 0%, ${mid} 55%, ${to} 100%)`;

  // Studio-light vignette: a soft radial falloff whose center drifts per id so
  // repeated tones don't all key-light from the same spot.
  const vx = 30 + (seed % 40);
  const vy = 20 + ((seed >> 4) % 40);
  const vignette = isLight
    ? `radial-gradient(circle at ${vx}% ${vy}%, rgba(255,255,255,0.5), transparent 62%)`
    : `radial-gradient(circle at ${vx}% ${vy}%, rgba(255,255,255,0.14), transparent 62%)`;

  return (
    <div
      role="img"
      aria-label={image.alt}
      className={`relative isolate flex items-center justify-center overflow-hidden ${className}`}
      style={{ background: gradient }}
      data-image-id={image.id}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: vignette }} />
      <svg
        aria-hidden
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className={`absolute inset-0 h-full w-full ${isLight ? "text-aurum-deep" : "text-aurum-ivory"}`}
      >
        <Motif kind={kind} seed={seed} />
      </svg>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ boxShadow: `inset 0 0 ${isLight ? "3rem" : "4rem"} rgba(0,0,0,${isLight ? 0.06 : 0.35})` }}
      />
      <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.09] mix-blend-overlay">
        <filter id={`grain-${image.id}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={seed % 100} stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#grain-${image.id})`} />
      </svg>
    </div>
  );
}
