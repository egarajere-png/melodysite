"use server";

import { requireStaffId } from "@/lib/supabase/staff-auth";
import { createDeal, setDealActive, type CreateDealInput } from "@/lib/supabase/deals-admin";
import { logAudit } from "@/lib/supabase/audit-log";

export type AdminDealActionResult = { ok: true } | { ok: false; error: string };

export async function createDealAction(input: CreateDealInput): Promise<AdminDealActionResult> {
  const staffId = await requireStaffId();
  if (!staffId) return { ok: false, error: "You don't have permission to manage deals." };
  try {
    await createDeal(input);
    await logAudit(staffId, "deal.created", "deal", undefined, undefined, { title: input.title, discountPercent: input.discountPercent });
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not create that deal." };
  }
}

export async function setDealActiveAction(id: string, isActive: boolean): Promise<AdminDealActionResult> {
  const staffId = await requireStaffId();
  if (!staffId) return { ok: false, error: "You don't have permission to manage deals." };
  try {
    await setDealActive(id, isActive);
    await logAudit(staffId, isActive ? "deal.activated" : "deal.deactivated", "deal", id);
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not update that deal." };
  }
}
