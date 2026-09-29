import { createClient } from "@/lib/supabase/server";

/** The /admin route guard in middleware already keeps non-staff out of the admin UI,
 * but a server action can be invoked directly, so every admin-only action re-checks
 * this itself. Returns the caller's profile id if they're an active ADMIN/ASSISTANT,
 * null otherwise. */
export async function requireStaffId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("role, is_active").eq("id", user.id).maybeSingle();
  const isStaff = Boolean(profile?.is_active) && (profile?.role === "ADMIN" || profile?.role === "ASSISTANT");
  return isStaff ? user.id : null;
}

/** Expenses, audit logs and content blocks are ADMIN-only per RLS (ASSISTANT is
 * deliberately excluded) — matches the same "profiles own read" restriction that
 * already made the Customers list admin-only. */
export async function requireAdminId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("role, is_active").eq("id", user.id).maybeSingle();
  return Boolean(profile?.is_active) && profile?.role === "ADMIN" ? user.id : null;
}

export interface StaffSession {
  id: string;
  name: string;
  email: string | null;
  role: "ADMIN" | "ASSISTANT";
}

/** Who is signed in to the admin panel, for the sidebar's identity block and for
 * hiding ADMIN-only sections from assistants. Null for anyone who isn't active staff
 * (the middleware will already have redirected them, so this is belt-and-braces). */
export async function getStaffSession(): Promise<StaffSession | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("role, is_active, full_name").eq("id", user.id).maybeSingle();
  if (!profile?.is_active || (profile.role !== "ADMIN" && profile.role !== "ASSISTANT")) return null;
  return {
    id: user.id,
    name: profile.full_name || user.email?.split("@")[0] || "Staff",
    email: user.email ?? null,
    role: profile.role,
  };
}
