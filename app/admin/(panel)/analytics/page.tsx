import { RevenueChart } from "@/components/admin/RevenueChart";
import { CategoryChart } from "@/components/admin/CategoryChart";
import { getMonthlySeries, getTopProducts, getCategoryPerformance, getInventoryMovement } from "@/lib/supabase/analytics";
import { formatKES } from "@/lib/format";

export default async function AdminAnalyticsPage() {
  const [monthly, topProducts, categoryPerformanceRaw, inventory] = await Promise.all([
    getMonthlySeries(),
    getTopProducts(8),
    getCategoryPerformance(),
    getInventoryMovement(),
  ]);
  const categoryPerformance = categoryPerformanceRaw.map((c) => ({ ...c, category: c.category.replace("-", " ") }));

  return (
    <div>
      <h1 className="mb-8 font-display text-3xl">Analytics</h1>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="border border-aurum-obsidian/10 bg-white p-5">
          <h2 className="mb-4 text-sm uppercase tracking-widest text-aurum-obsidian/50">Revenue &amp; Profit Over Time</h2>
          <RevenueChart data={monthly} />
        </div>

        <div className="border border-aurum-obsidian/10 bg-white p-5">
          <h2 className="mb-4 text-sm uppercase tracking-widest text-aurum-obsidian/50">Category Performance</h2>
          <CategoryChart data={categoryPerformance} />
        </div>

        <div className="border border-aurum-obsidian/10 bg-white p-5">
          <h2 className="mb-4 text-sm uppercase tracking-widest text-aurum-obsidian/50">Top Products</h2>
          <ul className="flex flex-col gap-3">
            {topProducts.map((p, i) => (
              <li key={p.name} className="flex items-center justify-between text-sm">
                <span>
                  {i + 1}. {p.name}
                </span>
                <span className="text-aurum-obsidian/60">
                  {formatKES(p.revenue)} · {p.quantity} sold
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="border border-aurum-obsidian/10 bg-white p-5">
          <h2 className="mb-4 text-sm uppercase tracking-widest text-aurum-obsidian/50">Inventory Movement (lowest stock first)</h2>
          <ul className="flex flex-col gap-3">
            {inventory.slice(0, 8).map((p) => (
              <li key={p.id} className="flex items-center justify-between text-sm">
                <span>{p.name}</span>
                <span className={p.stock === 0 ? "text-red-800" : p.stock <= 5 ? "text-aurum-earth" : "text-aurum-obsidian/60"}>
                  {p.stock} in stock
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
