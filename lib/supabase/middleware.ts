import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "./database.types";
import { isAdminOnlyPath } from "@/lib/staff-permissions";

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

  // /admin/login is the staff sign-in page itself — it must never be gated by the
  // same check it exists to satisfy, or an unauthenticated staff member could never
  // reach it.
  // Already-signed-in staff have no reason to see the sign-in form again.
  if (request.nextUrl.pathname === "/admin/login" && user) {
    const { data: profile } = await supabase.from("profiles").select("role, is_active").eq("id", user.id).single();
    if (profile?.is_active && STAFF_ROLES.has(profile.role)) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }

  if (request.nextUrl.pathname.startsWith("/admin") && request.nextUrl.pathname !== "/admin/login") {
    if (!user) {
      const redirectUrl = new URL(`/admin/login?next=${encodeURIComponent(request.nextUrl.pathname)}`, request.url);
      return NextResponse.redirect(redirectUrl);
    }

    const { data: profile } = await supabase.from("profiles").select("role, is_active").eq("id", user.id).single();
    const isStaff = Boolean(profile?.is_active) && STAFF_ROLES.has(profile?.role ?? "");
    if (!isStaff) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    // Assistants are sent back to the dashboard from ADMIN-only sections.
    if (profile?.role !== "ADMIN" && isAdminOnlyPath(request.nextUrl.pathname)) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }

  return response;
}
