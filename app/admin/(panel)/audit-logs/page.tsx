import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { AUDIT_AREAS, getAuditActors, getAuditLogs, type AuditArea, type AuditLogEntry, type AuditLogFilters, type AuditValue } from "@/lib/supabase/audit-log";
import { formatDateTime } from "@/lib/format";
import { ROLE_LABELS, type UserRole } from "@/lib/staff-permissions";

type SearchParams = Record<string, string | string[] | undefined>;

const control = "w-full border border-aurum-obsidian/15 bg-white px-3 py-2 text-sm focus-visible:border-aurum-obsidian focus-visible:outline-none";
const label = "mb-1 block text-[11px] uppercase tracking-widest text-aurum-obsidian/50";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function one(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

function readFilters(sp: SearchParams): AuditLogFilters {
  const role = one(sp.role);
  const area = one(sp.area);
  const actor = one(sp.actor);
  return {
    q: one(sp.q) || undefined,
    actorId: UUID.test(actor) ? actor : undefined,
    role: role === "ADMIN" || role === "ASSISTANT" ? role : undefined,
    area: area in AUDIT_AREAS ? (area as AuditArea) : undefined,
    from: one(sp.from) || undefined,
    to: one(sp.to) || undefined,
    sort: one(sp.sort) === "oldest" ? "oldest" : "newest",
    page: Number(one(sp.page)) || 1,
  };
}

/** The current filters as a query string, with some values replaced (e.g. the page). */
function hrefWith(filters: AuditLogFilters, patch: Partial<AuditLogFilters>): string {
  const merged = { ...filters, ...patch };
  const params = new URLSearchParams();
  if (merged.q) params.set("q", merged.q);
  if (merged.actorId) params.set("actor", merged.actorId);
  if (merged.role) params.set("role", merged.role);
  if (merged.area) params.set("area", merged.area);
  if (merged.from) params.set("from", merged.from);
  if (merged.to) params.set("to", merged.to);
  if (merged.sort === "oldest") params.set("sort", "oldest");
  if (merged.page && merged.page > 1) params.set("page", String(merged.page));
  const qs = params.toString();
  return qs ? `/admin/audit-logs?${qs}` : "/admin/audit-logs";
}

function show(value: AuditValue | object): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

/** Where to open the thing an entry is about, when it has its own page. */
function entityHref(entry: AuditLogEntry): string | null {
  if (entry.entityType === "order" && entry.entityLabel) return `/admin/orders/${entry.entityLabel}`;
  if (entry.entityType === "product" && entry.entityId && !entry.action.endsWith(".deleted")) return `/admin/products/${entry.entityId}`;
  if (entry.action.startsWith("delivery.")) return "/admin/delivery";
  if (entry.action.startsWith("deal.")) return "/admin/deals";
  if (entry.action.startsWith("collection.")) return "/admin/collections";
  if (entry.action.startsWith("category.")) return "/admin/categories";
  if (entry.action.startsWith("user.")) return "/admin/customers";
  if (entry.action.startsWith("expense.")) return "/admin/expenses";
  return null;
}

function RoleBadge({ role }: { role: string | null }) {
  if (!role) return null;
  const isAdmin = role === "ADMIN";
  return (
    <span className={`mt-1 inline-block px-1.5 py-0.5 text-[10px] uppercase tracking-widest ${isAdmin ? "bg-aurum-obsidian text-aurum-ivory" : "bg-aurum-gold/20 text-aurum-obsidian/80"}`}>
      {ROLE_LABELS[role as UserRole] ?? role}
    </span>
  );
}

export default async function AdminAuditLogsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const filters = readFilters(await searchParams);
  const [{ entries, total, page, pageSize }, actors] = await Promise.all([getAuditLogs(filters), getAuditActors()]);
  const firstShown = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastShown = Math.min(page * pageSize, total);
  const filtered = Boolean(filters.q || filters.actorId || filters.role || filters.area || filters.from || filters.to);

  return (
    <div>
      <h1 className="mb-1 font-display text-3xl">Audit Log</h1>
      <p className="mb-8 text-sm text-aurum-obsidian/50">Every change made in the admin panel — who made it, when, and exactly what changed.</p>

      <form method="get" className="mb-6 grid gap-4 border border-aurum-obsidian/10 bg-white p-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2">
          <label htmlFor="audit-q" className={label}>Search</label>
          <input id="audit-q" name="q" defaultValue={filters.q} placeholder="Order number, product, agent, person…" className={control} />
        </div>
        <div>
          <label htmlFor="audit-actor" className={label}>Person</label>
          <select id="audit-actor" name="actor" defaultValue={filters.actorId ?? ""} className={control}>
            <option value="">Everyone</option>
            {actors.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ({ROLE_LABELS[a.role as UserRole] ?? a.role})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="audit-role" className={label}>Role at the time</label>
          <select id="audit-role" name="role" defaultValue={filters.role ?? ""} className={control}>
            <option value="">Admins &amp; assistants</option>
            <option value="ADMIN">Administrators only</option>
            <option value="ASSISTANT">Assistants only</option>
          </select>
        </div>
        <div>
          <label htmlFor="audit-area" className={label}>Kind of change</label>
          <select id="audit-area" name="area" defaultValue={filters.area ?? ""} className={control}>
            <option value="">All changes</option>
            {Object.entries(AUDIT_AREAS).map(([value, name]) => (
              <option key={value} value={value}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="audit-from" className={label}>From</label>
          <input id="audit-from" name="from" type="date" defaultValue={filters.from} className={control} />
        </div>
        <div>
          <label htmlFor="audit-to" className={label}>To</label>
          <input id="audit-to" name="to" type="date" defaultValue={filters.to} className={control} />
        </div>
        <div>
          <label htmlFor="audit-sort" className={label}>Order</label>
          <select id="audit-sort" name="sort" defaultValue={filters.sort} className={control}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </div>
        <div className="flex items-center gap-4 sm:col-span-2 lg:col-span-4">
          <button type="submit" className="bg-aurum-deep px-5 py-2.5 text-xs uppercase tracking-widest text-aurum-ivory transition-colors hover:bg-aurum-plum">
            Apply filters
          </button>
          {filtered && (
            <Link href="/admin/audit-logs" className="text-xs uppercase tracking-widest text-aurum-obsidian/60 underline-offset-4 hover:underline">
              Clear
            </Link>
          )}
          <span className="ml-auto text-sm text-aurum-obsidian/50">
            {total === 0 ? "No entries" : `Showing ${firstShown}–${lastShown} of ${total}`}
          </span>
        </div>
      </form>

      <div className="overflow-x-auto border border-aurum-obsidian/10 bg-white">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="border-b border-aurum-obsidian/10 text-xs uppercase tracking-widest text-aurum-obsidian/50">
              <th className="w-44 px-4 py-3 font-normal">When</th>
              <th className="w-48 px-4 py-3 font-normal">Who</th>
              <th className="px-4 py-3 font-normal">What happened</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-10 text-center text-aurum-obsidian/50">
                  {filtered ? "Nothing matches these filters." : "No admin actions recorded yet."}
                </td>
              </tr>
            ) : (
              entries.map((entry) => {
                const href = entityHref(entry);
                // An edit shows "old → new" for each field; a creation just lists the values.
                const isEdit = entry.changes.some((c) => c.before !== null);
                return (
                  <tr key={entry.id} className="border-b border-aurum-obsidian/5 align-top last:border-0">
                    <td className="whitespace-nowrap px-4 py-3 text-aurum-obsidian/60">{formatDateTime(entry.createdAt)}</td>
                    <td className="px-4 py-3">
                      {entry.actorId ? (
                        <Link href={hrefWith(filters, { actorId: entry.actorId, page: 1 })} className="underline-offset-4 hover:underline" title="Show only this person's changes">
                          {entry.actorName}
                        </Link>
                      ) : (
                        entry.actorName
                      )}
                      <br />
                      <RoleBadge role={entry.actorRole} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-start gap-x-3 gap-y-1">
                        <span className="mt-0.5 border border-aurum-obsidian/15 px-1.5 py-0.5 text-[10px] uppercase tracking-widest text-aurum-obsidian/60">{entry.area}</span>
                        <span className="min-w-0 flex-1">{entry.summary}</span>
                        {href && (
                          <Link href={href} className="inline-flex items-center gap-1 text-xs text-aurum-obsidian/50 hover:text-aurum-obsidian" aria-label={`Open ${entry.entityLabel ?? entry.area}`}>
                            Open <ExternalLink size={12} strokeWidth={1.5} />
                          </Link>
                        )}
                      </div>
                      {entry.changes.length > 0 && (
                        <dl className="mt-2 grid grid-cols-[minmax(7rem,max-content)_1fr] gap-x-4 gap-y-1 border-l-2 border-aurum-obsidian/10 pl-3 text-xs">
                          {entry.changes.map((c) => (
                            <div key={c.field} className="contents">
                              <dt className="text-aurum-obsidian/50">{c.field}</dt>
                              <dd className="break-words">
                                {isEdit ? (
                                  <>
                                    <span className="text-aurum-obsidian/45">{show(c.before)}</span>
                                    <span className="px-1.5 text-aurum-obsidian/40">→</span>
                                    <span className="font-medium">{show(c.after)}</span>
                                  </>
                                ) : (
                                  show(c.after)
                                )}
                              </dd>
                            </div>
                          ))}
                        </dl>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {total > pageSize && (
        <nav className="mt-6 flex items-center justify-between text-xs uppercase tracking-widest" aria-label="Audit log pages">
          {page > 1 ? (
            <Link href={hrefWith(filters, { page: page - 1 })} className="border border-aurum-obsidian/15 px-4 py-2 hover:border-aurum-obsidian">
              ← Previous
            </Link>
          ) : (
            <span />
          )}
          <span className="text-aurum-obsidian/50">
            Page {page} of {Math.ceil(total / pageSize)}
          </span>
          {lastShown < total ? (
            <Link href={hrefWith(filters, { page: page + 1 })} className="border border-aurum-obsidian/15 px-4 py-2 hover:border-aurum-obsidian">
              Next →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </div>
  );
}
