"use server";

import { revalidatePath } from "next/cache";
import { requireStaffId } from "@/lib/supabase/staff-auth";
import { createDeal, deleteDeal, DealError, getAdminDeals, setDealActive, updateDeal, type AdminDeal, type DealInput } from "@/lib/supabase/deals-admin";
import { logAudit } from "@/lib/supabase/audit-log";

export type AdminDealActionResult = { ok: true; deals: AdminDeal[]; deactivated: string[] } | { ok: false; error: string };

async function run(work: (staffId: string) => Promise<string[] | void>, failure: string): Promise<AdminDealActionResult> {
  const staffId = await requireStaffId();
  if (!staffId) return { ok: false, error: "You don't have permission to manage deals." };
  try {
    const deactivated = (await work(staffId)) ?? [];
    // Deal prices show on the homepage, shop and product pages.
    revalidatePath("/", "layout");
    return { ok: true, deals: await getAdminDeals(), deactivated };
  } catch (e) {
    return { ok: false, error: e instanceof DealError ? e.message : failure };
  }
}

export async function createDealAction(input: DealInput): Promise<AdminDealActionResult> {
  return run(async (staffId) => {
    const { id, deactivated } = await createDeal(input);
    await logAudit(staffId, "deal.created", "deal", id, undefined, { title: input.title, discountPercent: input.discountPercent });
    return deactivated;
  }, "Could not create that deal.");
}

export async function updateDealAction(id: string, input: DealInput): Promise<AdminDealActionResult> {
  return run(async (staffId) => {
    const { deactivated } = await updateDeal(id, input);
    await logAudit(staffId, "deal.updated", "deal", id, undefined, { title: input.title, discountPercent: input.discountPercent, isActive: input.isActive });
    return deactivated;
  }, "Could not save that deal.");
}

export async function setDealActiveAction(id: string, isActive: boolean): Promise<AdminDealActionResult> {
  return run(async (staffId) => {
    const { deactivated } = await setDealActive(id, isActive);
    await logAudit(staffId, isActive ? "deal.activated" : "deal.deactivated", "deal", id);
    return deactivated;
  }, "Could not update that deal.");
}

export async function deleteDealAction(id: string, title: string): Promise<AdminDealActionResult> {
  return run(async (staffId) => {
    await deleteDeal(id);
    await logAudit(staffId, "deal.deleted", "deal", id, { title });
  }, "Could not delete that deal.");
}
