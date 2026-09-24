import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "./database.types";

const STAFF_ROLES = new Set(["ADMIN", "ASSISTANT"]);

/**
 * Refreshes the Supabase session cookie on every request and, for any /admin route,
 * checks the caller's profile role before letting the request through. This is the
 * only place admin access is gated — RLS still protects the underlying data even if
 * this check is ever bypassed, but the UI itself should never render for non-staff.
 */
export async function updateSession(request: NextRequest) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    // Supabase isn't configured (local scaffold without env vars) — nothing to guard yet.
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookies) => {
        cookies.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (request.nextUrl.pathname.startsWith("/admin")) {
    if (!user) {
      const redirectUrl = new URL(`/account?next=${encodeURIComponent(request.nextUrl.pathname)}`, request.url);
      return NextResponse.redirect(redirectUrl);
    }

    const { data: profile } = await supabase.from("profiles").select("role, is_active").eq("id", user.id).single();
    const isStaff = Boolean(profile?.is_active) && STAFF_ROLES.has(profile?.role ?? "");
    if (!isStaff) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return response;
}
