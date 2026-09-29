import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { User } from "@supabase/supabase-js";
import { OWNER_EMAIL, type UserRole } from "@/lib/staff-permissions";

/**
 * Everyone with an account — customers, assistants and admins — for the ADMIN-only
 * Customers & Access page. Roles and active status live on profiles (RLS + the
 * protect_profile_privileged_columns trigger only let admins change them); email,
 * sign-in method and suspension live in auth.users, read with the service-role client.
 */

export interface AdminUser {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: UserRole;
  isActive: boolean;
  isOwner: boolean;
  signInMethod: string;
  joinedAt: string;
  lastSignInAt: string | null;
  totalOrders: number;
  totalSpend: number;
  lastOrderAt: string | null;
}

export class AccessError extends Error {}

async function listAuthUsers() {
  const admin = createAdminClient();
  const all: User[] = [];
  for (let page = 1; page <= 50; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    all.push(...data.users);
    if (data.users.length < 1000) break;
  }
  return all;
}

export async function getAdminUsers(): Promise<AdminUser[]> {
  const supabase = await createClient();
  const [{ data: profiles, error }, authUsers] = await Promise.all([
    supabase.from("profiles").select("id, full_name, phone, role, is_active, created_at, orders ( total, created_at, status )").order("created_at", { ascending: false }),
    listAuthUsers(),
  ]);
  if (error) throw error;
  const authById = new Map(authUsers.map((u) => [u.id, u]));

  return (profiles ?? []).map((p) => {
    const auth = authById.get(p.id);
    // Unpaid/cancelled orders aren't spend.
    const orders = (p.orders as unknown as { total: number; created_at: string; status: string }[]).filter((o) => !["PAYMENT_PENDING", "CANCELLED", "REFUNDED"].includes(o.status));
    const email = auth?.email ?? null;
    return {
      id: p.id,
      name: p.full_name || (auth?.user_metadata?.full_name as string | undefined) || (auth?.user_metadata?.name as string | undefined) || email?.split("@")[0] || "—",
      email,
      phone: p.phone,
      role: p.role,
      isActive: p.is_active,
      isOwner: email?.toLowerCase() === OWNER_EMAIL,
      signInMethod: auth?.app_metadata?.provider === "google" ? "Google" : "Email",
      joinedAt: p.created_at,
      lastSignInAt: auth?.last_sign_in_at ?? null,
      totalOrders: orders.length,
      totalSpend: orders.reduce((sum, o) => sum + Number(o.total), 0),
      lastOrderAt: orders.reduce<string | null>((latest, o) => (!latest || o.created_at > latest ? o.created_at : latest), null),
    };
  });
}

async function loadTarget(targetId: string, actorId: string) {
  if (targetId === actorId) throw new AccessError("You can't change your own access. Ask another administrator.");
  const admin = createAdminClient();
  const [{ data: profile }, { data: auth }] = await Promise.all([
    admin.from("profiles").select("id, role, is_active, full_name").eq("id", targetId).maybeSingle(),
    admin.auth.admin.getUserById(targetId),
  ]);
  if (!profile) throw new AccessError("That account no longer exists.");
  if (auth?.user?.email?.toLowerCase() === OWNER_EMAIL) throw new AccessError("The owner's account can't be changed.");
  return { profile, email: auth?.user?.email ?? null };
}

/** Never leave the shop without an administrator who can sign in. */
async function assertOtherActiveAdmin(excludingId: string) {
  const admin = createAdminClient();
  const { count } = await admin.from("profiles").select("id", { count: "exact", head: true }).eq("role", "ADMIN").eq("is_active", true).neq("id", excludingId);
  if (!count) throw new AccessError("There must always be at least one active administrator.");
}

export async function setUserRole(actorId: string, targetId: string, role: UserRole): Promise<{ before: UserRole; name: string }> {
  const { profile, email } = await loadTarget(targetId, actorId);
  if (profile.role === "ADMIN" && role !== "ADMIN") await assertOtherActiveAdmin(targetId);
  // The caller's own session is an active ADMIN (checked by the action), which both RLS
  // and the privileged-column trigger require for a role change.
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ role }).eq("id", targetId);
  if (error) throw error;
  return { before: profile.role, name: profile.full_name || email || "that account" };
}

/**
 * Suspending does two things: marks the profile inactive (staff lose the admin panel
 * immediately) and bans the auth user so they can't sign in or refresh a session.
 * Reactivating reverses both.
 */
export async function setUserActive(actorId: string, targetId: string, active: boolean): Promise<{ name: string }> {
  const { profile, email } = await loadTarget(targetId, actorId);
  if (!active && profile.role === "ADMIN") await assertOtherActiveAdmin(targetId);
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ is_active: active }).eq("id", targetId);
  if (error) throw error;
  const { error: banError } = await createAdminClient().auth.admin.updateUserById(targetId, { ban_duration: active ? "none" : "876000h" });
  if (banError) throw banError;
  return { name: profile.full_name || email || "that account" };
}
