import Link from "next/link";
import { DollarSign, ShoppingBag, Package, TrendingUp, Gauge, AlertTriangle, XCircle, Clock } from "lucide-react";
import { StatTile } from "@/components/admin/StatTile";
import { RevenueChart } from "@/components/admin/RevenueChart";
import { getDashboardMetrics, getMonthlySeries, getTopProducts } from "@/lib/analytics";
import { formatKES } from "@/lib/format";

export default function AdminDashboardPage() {
  const metrics = getDashboardMetrics();
  const monthly = getMonthlySeries();
  const topProducts = getTopProducts(5);

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl">Dashboard</h1>
          <p className="mt-1 text-sm text-aurum-obsidian/50">Showing demo data — connect a backend for live metrics.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <StatTile label="Total Revenue" value={formatKES(metrics.totalRevenue)} icon={DollarSign} />
        <StatTile label="Total Orders" value={String(metrics.totalOrders)} icon={ShoppingBag} />
        <StatTile label="Items Sold" value={String(metrics.itemsSold)} icon={Package} />
        <StatTile label="Profit" value={formatKES(metrics.profit)} icon={TrendingUp} />
        <StatTile label="Avg. Order Value" value={formatKES(metrics.averageOrderValue)} icon={Gauge} />
        <StatTile label="Pending Orders" value={String(metrics.pendingOrders)} icon={Clock} tone={metrics.pendingOrders > 0 ? "warning" : "default"} />
        <StatTile label="Low Stock" value={String(metrics.lowStock.length)} icon={AlertTriangle} tone={metrics.lowStock.length > 0 ? "warning" : "default"} />
        <StatTile label="Out of Stock" value={String(metrics.outOfStock.length)} icon={XCircle} tone={metrics.outOfStock.length > 0 ? "danger" : "default"} />
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="border border-aurum-obsidian/10 bg-white p-5">
          <h2 className="mb-4 text-sm uppercase tracking-widest text-aurum-obsidian/50">Monthly Sales</h2>
          <RevenueChart data={monthly} />
        </div>

        <div className="border border-aurum-obsidian/10 bg-white p-5">
          <h2 className="mb-4 text-sm uppercase tracking-widest text-aurum-obsidian/50">Bestsellers</h2>
          <ul className="flex flex-col gap-4">
            {topProducts.map((p, i) => (
              <li key={p.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center border border-aurum-obsidian/15 text-xs">
                    {i + 1}
                  </span>
                  <span>{p.name}</span>
                </div>
                <div className="text-right">
                  <p>{formatKES(p.revenue)}</p>
                  <p className="text-xs text-aurum-obsidian/40">{p.quantity} sold</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {(metrics.lowStock.length > 0 || metrics.outOfStock.length > 0) && (
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          {metrics.lowStock.length > 0 && (
            <div className="border border-aurum-earth/30 bg-aurum-earth/5 p-5">
              <h2 className="mb-3 text-sm uppercase tracking-widest text-aurum-earth">Low Stock</h2>
              <ul className="flex flex-col gap-2 text-sm">
                {metrics.lowStock.map((p) => (
                  <li key={p.id} className="flex items-center justify-between">
                    <Link href="/admin/products" className="hover:underline">
                      {p.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {metrics.outOfStock.length > 0 && (
            <div className="border border-red-700/20 bg-red-700/5 p-5">
              <h2 className="mb-3 text-sm uppercase tracking-widest text-red-800">Out of Stock</h2>
              <ul className="flex flex-col gap-2 text-sm">
                {metrics.outOfStock.map((p) => (
                  <li key={p.id} className="flex items-center justify-between">
                    <Link href="/admin/products" className="hover:underline">
                      {p.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
