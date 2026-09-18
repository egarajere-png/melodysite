import { customers } from "@/data/customers";
import { formatKES, formatDate } from "@/lib/format";

export default function AdminCustomersPage() {
  return (
    <div>
      <h1 className="mb-8 font-display text-3xl">Customers</h1>

      <div className="overflow-x-auto border border-aurum-obsidian/10 bg-white">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-aurum-obsidian/10 text-xs uppercase tracking-widest text-aurum-obsidian/50">
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Orders</th>
              <th className="px-4 py-3">Total Spend</th>
              <th className="px-4 py-3">Last Order</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id} className="border-b border-aurum-obsidian/5 last:border-0 hover:bg-aurum-ivory/60">
                <td className="px-4 py-3">{c.name}</td>
                <td className="px-4 py-3 text-aurum-obsidian/60">
                  <p>{c.email}</p>
                  {c.phone && <p className="text-xs">{c.phone}</p>}
                </td>
                <td className="px-4 py-3">{c.totalOrders}</td>
                <td className="px-4 py-3">{formatKES(c.totalSpend)}</td>
                <td className="px-4 py-3 text-aurum-obsidian/60">{c.lastOrderAt ? formatDate(c.lastOrderAt) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
