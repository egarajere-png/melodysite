"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { createExpenseAction } from "@/app/actions/admin-expenses";
import { formatKES, formatDate } from "@/lib/format";
import type { Expense } from "@/lib/supabase/expenses-admin";
import { useToast } from "@/components/admin/Toast";

export function AdminExpensesClient({ expenses: initial }: { expenses: Expense[] }) {
  const toast = useToast();
  const [expenses, setExpenses] = useState(initial);
  const [showForm, setShowForm] = useState(false);
  const [expenseDate, setExpenseDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!category.trim() || amount <= 0) return;
    const result = await createExpenseAction({ expenseDate, category: category.trim(), description: description.trim(), amount });
    if (!result.ok) {
      setError(result.error);
      toast.error(result.error);
      return;
    }
    toast.success(`Expense of ${formatKES(amount)} has been recorded.`);
    setExpenses((prev) => [{ id: `temp-${Date.now()}`, expenseDate, category: category.trim(), description: description.trim() || null, amount }, ...prev]);
    setCategory("");
    setDescription("");
    setAmount(0);
    setShowForm(false);
    setError(null);
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl">Expenses</h1>
          <p className="mt-1 text-sm text-aurum-obsidian/50">Total recorded: {formatKES(total)}</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 bg-aurum-deep px-5 py-3 text-xs uppercase tracking-widest text-aurum-ivory transition-colors hover:bg-aurum-plum"
        >
          <Plus size={15} strokeWidth={1.5} />
          Record Expense
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="mb-8 grid gap-4 border border-aurum-obsidian/10 bg-white p-6 sm:grid-cols-2">
          <input type="date" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} required className="border border-aurum-obsidian/15 px-3 py-2.5 text-sm" />
          <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Category (e.g. Materials, Shipping)" required className="border border-aurum-obsidian/15 px-3 py-2.5 text-sm" />
          <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optional)" className="border border-aurum-obsidian/15 px-3 py-2.5 text-sm" />
          <input type="number" min={0} value={amount} onChange={(e) => setAmount(Number(e.target.value))} placeholder="Amount (KES)" required className="border border-aurum-obsidian/15 px-3 py-2.5 text-sm" />
          <button type="submit" className="bg-aurum-deep px-6 py-2.5 text-xs uppercase tracking-widest text-aurum-ivory sm:col-span-2 sm:w-fit">
            Save Expense
          </button>
          {error && <p className="text-sm text-aurum-earth sm:col-span-2">{error}</p>}
        </form>
      )}

      <div className="overflow-x-auto border border-aurum-obsidian/10 bg-white">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead>
            <tr className="border-b border-aurum-obsidian/10 text-xs uppercase tracking-widest text-aurum-obsidian/50">
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Amount</th>
            </tr>
          </thead>
          <tbody>
            {expenses.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-aurum-obsidian/50">
                  No expenses recorded yet.
                </td>
              </tr>
            ) : (
              expenses.map((e) => (
                <tr key={e.id} className="border-b border-aurum-obsidian/5 last:border-0 hover:bg-aurum-ivory/60">
                  <td className="px-4 py-3 text-aurum-obsidian/60">{formatDate(e.expenseDate)}</td>
                  <td className="px-4 py-3">{e.category}</td>
                  <td className="px-4 py-3 text-aurum-obsidian/60">{e.description ?? "—"}</td>
                  <td className="px-4 py-3">{formatKES(e.amount)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
