import { RevenueChart } from "@/components/admin/RevenueChart";
import { CategoryChart } from "@/components/admin/CategoryChart";
import { getMonthlySeries, getTopProducts, getCategoryPerformance, getInventoryMovement } from "@/lib/analytics";
import { formatKES } from "@/lib/format";

export default function AdminAnalyticsPage() {
  const monthly = getMonthlySeries();
  const topProducts = getTopProducts(8);
  const categoryPerformance = getCategoryPerformance().map((c) => ({
    ...c,
    category: c.category.replace("-", " "),
  }));
  const inventory = getInventoryMovement();

  return (
    <div>
      <h1 className="mb-1 font-display text-3xl">Analytics</h1>
      <p className="mb-8 text-sm text-aurum-obsidian/50">Showing demo data — connect a backend for live metrics.</p>

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
              <li key={p.name} className="flex items-center justify-between text-sm">
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
