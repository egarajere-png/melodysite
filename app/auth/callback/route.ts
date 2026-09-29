import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { safeNextPath } from "@/lib/auth-redirect";

/**
 * Lands every auth round-trip back on the site: Google sign-in, email-confirmation
 * links and password-reset links.
 *
 * This must use the cookie-backed server client. Sign-in uses PKCE: the browser saved
 * a one-time "code verifier" cookie before leaving for Google, and exchanging the code
 * needs it. (The previous version gave Supabase an empty cookie list here, so the
 * exchange could never succeed.) The resulting session cookies are written back
 * through the same cookie store onto this redirect response.
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const next = safeNextPath(url.searchParams.get("next"));

  const fail = (message: string) => {
    const target = new URL("/account", url.origin);
    target.searchParams.set("auth_error", message);
    if (next !== "/account") target.searchParams.set("next", next);
    return NextResponse.redirect(target);
  };

  // Google (or Supabase) reports its own failures back as query params.
  const providerError = url.searchParams.get("error_description") ?? url.searchParams.get("error");
  if (providerError) return fail(providerError.replace(/\+/g, " "));
  if (!isSupabaseConfigured()) return fail("Sign-in isn't configured yet.");

  const supabase = await createClient();
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return fail(
        /code verifier/i.test(error.message)
          ? "That sign-in link was opened in a different browser. Please sign in again from this one."
          : "We couldn't complete your sign-in. Please try again."
      );
    }
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (error) return fail("That link has expired or was already used. Please request a new one.");
  } else {
    return fail("That sign-in link is incomplete. Please try again.");
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
