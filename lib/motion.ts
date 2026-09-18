// Shared motion tokens for Framer Motion. Mirrors the CSS custom properties in globals.css
// so JS-driven and CSS-driven animation stay on the same easing language across the site.

export const easeLuxury = [0.16, 1, 0.3, 1] as const;
export const easeSoft = [0.4, 0, 0.2, 1] as const;
export const easeEditorial = [0.65, 0, 0.35, 1] as const;

export const durations = {
  fast: 0.3,
  base: 0.55,
  slow: 0.9,
} as const;

export const viewportOnce = { once: true, margin: "-10% 0px -10% 0px" } as const;
