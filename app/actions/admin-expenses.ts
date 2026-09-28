"use server";

import { requireAdminId } from "@/lib/supabase/staff-auth";
import { createExpense, type CreateExpenseInput } from "@/lib/supabase/expenses-admin";
import { logAudit } from "@/lib/supabase/audit-log";

export type AdminExpenseActionResult = { ok: true } | { ok: false; error: string };

export async function createExpenseAction(input: CreateExpenseInput): Promise<AdminExpenseActionResult> {
  const adminId = await requireAdminId();
  if (!adminId) return { ok: false, error: "You don't have permission to record expenses." };
  try {
    await createExpense(adminId, input);
    await logAudit(adminId, "expense.created", "business_expense", undefined, undefined, { category: input.category, amount: input.amount });
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not record that expense." };
  }
}
