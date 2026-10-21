"use server";

import { requireAdminId } from "@/lib/supabase/staff-auth";
import { logAudit } from "@/lib/supabase/audit-log";
import { AccessError, getAdminUsers, setUserActive, setUserRole, type AdminUser } from "@/lib/supabase/customers-admin";
import { ROLE_LABELS, withArticle, type UserRole } from "@/lib/staff-permissions";

export type AccessActionResult = { ok: true; users: AdminUser[]; message: string } | { ok: false; error: string };

const ROLES: UserRole[] = ["CUSTOMER", "ASSISTANT", "ADMIN"];

export async function setUserRoleAction(userId: string, role: UserRole): Promise<AccessActionResult> {
  const adminId = await requireAdminId();
  if (!adminId) return { ok: false, error: "Only administrators can change access." };
  if (!ROLES.includes(role)) return { ok: false, error: "Unknown role." };
  try {
    const { before, name } = await setUserRole(adminId, userId, role);
    await logAudit(adminId, "user.role_changed", "profile", {
      entityId: userId,
      label: name,
      summary: `Changed ${name}'s role from ${ROLE_LABELS[before]} to ${ROLE_LABELS[role]}`,
      before: { Role: ROLE_LABELS[before] },
      after: { Role: ROLE_LABELS[role] },
    });
    return { ok: true, users: await getAdminUsers(), message: `${name} is now ${withArticle(role)}.` };
  } catch (e) {
    return { ok: false, error: e instanceof AccessError ? e.message : "Could not change that role." };
  }
}

export async function setUserActiveAction(userId: string, active: boolean): Promise<AccessActionResult> {
  const adminId = await requireAdminId();
  if (!adminId) return { ok: false, error: "Only administrators can change access." };
  try {
    const { name } = await setUserActive(adminId, userId, active);
    await logAudit(adminId, active ? "user.reactivated" : "user.suspended", "profile", {
      entityId: userId,
      label: name,
      summary: active ? `Reactivated ${name}'s account` : `Suspended ${name}'s account`,
      before: { Account: active ? "Suspended" : "Active" },
      after: { Account: active ? "Active" : "Suspended" },
    });
    return {
      ok: true,
      users: await getAdminUsers(),
      message: active ? `${name} has been reactivated and can sign in again.` : `${name} has been suspended and can no longer sign in.`,
    };
  } catch (e) {
    return { ok: false, error: e instanceof AccessError ? e.message : "Could not update that account." };
  }
}
