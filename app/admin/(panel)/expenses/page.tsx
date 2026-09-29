import { getExpenses } from "@/lib/supabase/expenses-admin";
import { AdminExpensesClient } from "@/components/admin/AdminExpensesClient";

export default async function AdminExpensesPage() {
  const expenses = await getExpenses();
  return <AdminExpensesClient expenses={expenses} />;
}
