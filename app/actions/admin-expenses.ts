"use server";

import { requireAdminId } from "@/lib/supabase/staff-auth";
import { createExpense, type CreateExpenseInput } from "@/lib/supabase/expenses-admin";
import { logAudit } from "@/lib/supabase/audit-log";
import { formatKES } from "@/lib/format";

export type AdminExpenseActionResult = { ok: true } | { ok: false; error: string };

export async function createExpenseAction(input: CreateExpenseInput): Promise<AdminExpenseActionResult> {
  const adminId = await requireAdminId();
  if (!adminId) return { ok: false, error: "You don't have permission to record expenses." };
  try {
    await createExpense(adminId, input);
    await logAudit(adminId, "expense.created", "business_expense", {
      label: input.category,
      summary: `Recorded a ${formatKES(input.amount)} expense for ${input.category}`,
      after: { Date: input.expenseDate, Category: input.category, Amount: formatKES(input.amount), ...(input.description ? { Description: input.description } : {}) },
    });
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not record that expense." };
  }
}
