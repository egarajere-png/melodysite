import { getAuditLogs } from "@/lib/supabase/audit-log";
import { formatDate } from "@/lib/format";

const ACTION_LABELS: Record<string, string> = {
  "order.status_updated": "Updated order status",
  "product.created": "Created product",
  "product.updated": "Updated product",
  "deal.created": "Created deal",
  "deal.activated": "Activated deal",
  "deal.deactivated": "Deactivated deal",
  "collection.created": "Created collection",
  "collection.deactivated": "Removed collection",
};

export default async function AdminAuditLogsPage() {
  const logs = await getAuditLogs();

  return (
    <div>
      <h1 className="mb-1 font-display text-3xl">Audit Log</h1>
      <p className="mb-8 text-sm text-aurum-obsidian/50">A record of admin actions across products, orders, deals and collections.</p>

      <div className="overflow-x-auto border border-aurum-obsidian/10 bg-white">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-aurum-obsidian/10 text-xs uppercase tracking-widest text-aurum-obsidian/50">
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3">Staff</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-aurum-obsidian/50">
                  No admin actions recorded yet.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="border-b border-aurum-obsidian/5 last:border-0 hover:bg-aurum-ivory/60">
                  <td className="px-4 py-3 text-aurum-obsidian/60">{formatDate(log.createdAt)}</td>
                  <td className="px-4 py-3">{log.actorName}</td>
                  <td className="px-4 py-3">{ACTION_LABELS[log.action] ?? log.action}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
