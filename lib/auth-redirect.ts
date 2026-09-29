// Shared by the auth callback route and the client-side sign-in forms.

/** Only allow same-site relative paths as post-sign-in destinations (no open redirects). */
export function safeNextPath(next: string | null | undefined, fallback = "/account"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}

/** Where Supabase should send the browser back to after Google / email links. */
export function authCallbackUrl(origin: string, next: string): string {
  return `${origin}/auth/callback?next=${encodeURIComponent(safeNextPath(next))}`;
}
