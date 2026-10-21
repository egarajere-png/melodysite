"use server";

import { revalidatePath } from "next/cache";
import { requireStaffId } from "@/lib/supabase/staff-auth";
import { createDeal, deleteDeal, DealError, getAdminDeals, setDealActive, updateDeal, type AdminDeal, type DealInput } from "@/lib/supabase/deals-admin";
import { changedFields, listNames, logAudit, type AuditFields } from "@/lib/supabase/audit-log";

function dealFields(d: DealInput | AdminDeal): AuditFields {
  return {
    Title: d.title.trim(),
    Discount: `${d.discountPercent}%`,
    Starts: d.startDate,
    Ends: d.endDate,
    Products: d.productIds.length,
    Active: d.isActive ? "Yes" : "No",
  };
}

async function findDeal(id: string) {
  return (await getAdminDeals().catch(() => [])).find((d) => d.id === id) ?? null;
}

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
    await logAudit(staffId, "deal.created", "deal", {
      entityId: id,
      label: input.title.trim(),
      summary: `Created deal "${input.title.trim()}" (${input.discountPercent}% off ${input.productIds.length} product${input.productIds.length === 1 ? "" : "s"})`,
      after: dealFields(input),
    });
    return deactivated;
  }, "Could not create that deal.");
}

export async function updateDealAction(id: string, input: DealInput): Promise<AdminDealActionResult> {
  return run(async (staffId) => {
    const previous = await findDeal(id);
    const { deactivated } = await updateDeal(id, input);
    const diff = previous ? changedFields(dealFields(previous), dealFields(input)) : null;
    await logAudit(staffId, "deal.updated", "deal", {
      entityId: id,
      label: input.title.trim(),
      summary: diff?.names.length ? `Edited deal "${input.title.trim()}" — changed ${listNames(diff.names)}` : `Saved deal "${input.title.trim()}" (no changes)`,
      before: diff?.before,
      after: diff ? diff.after : dealFields(input),
    });
    return deactivated;
  }, "Could not save that deal.");
}

export async function setDealActiveAction(id: string, isActive: boolean): Promise<AdminDealActionResult> {
  return run(async (staffId) => {
    const deal = await findDeal(id);
    const { deactivated } = await setDealActive(id, isActive);
    const title = deal?.title ?? "a deal";
    await logAudit(staffId, isActive ? "deal.activated" : "deal.deactivated", "deal", {
      entityId: id,
      label: deal?.title,
      summary: `${isActive ? "Activated" : "Deactivated"} deal "${title}"`,
      before: { Active: isActive ? "No" : "Yes" },
      after: { Active: isActive ? "Yes" : "No" },
    });
    return deactivated;
  }, "Could not update that deal.");
}

export async function deleteDealAction(id: string, title: string): Promise<AdminDealActionResult> {
  return run(async (staffId) => {
    await deleteDeal(id);
    await logAudit(staffId, "deal.deleted", "deal", { entityId: id, label: title, summary: `Deleted deal "${title}"` });
  }, "Could not delete that deal.");
}
