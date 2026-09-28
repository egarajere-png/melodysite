import { createClient } from "@/lib/supabase/server";

export interface Expense {
  id: string;
  expenseDate: string;
  category: string;
  description: string | null;
  amount: number;
}

export interface CreateExpenseInput {
  expenseDate: string;
  category: string;
  description?: string;
  amount: number;
}

/** RLS ("admin expenses") restricts this to is_admin(), so the cookie-based client
 * is sufficient — an ASSISTANT session would just get an empty list back, same as
 * the Customers page. */
export async function getExpenses(): Promise<Expense[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("business_expenses")
    .select("id, expense_date, category, description, amount")
    .order("expense_date", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((e) => ({
    id: e.id,
    expenseDate: e.expense_date,
    category: e.category,
    description: e.description,
    amount: Number(e.amount),
  }));
}

export async function createExpense(adminId: string, input: CreateExpenseInput): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("business_expenses").insert({
    expense_date: input.expenseDate,
    category: input.category,
    description: input.description || null,
    amount: input.amount,
    created_by: adminId,
  });
  if (error) throw error;
}
