import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/database.types";

/** Values as staff should read them: "In Transit", "KSh 180", "Visible". */
export type AuditValue = string | number | boolean | null;
export type AuditFields = Record<string, AuditValue>;

export interface AuditEntryInput {
  entityId?: string;
  /** What the action was about, as staff know it: "AE-9016FBAB", "Maasai Collar". */
  label?: string;
  /** One sentence, e.g. 'Changed order AE-9016FBAB from "In Transit" to "Delivered"'. */
  summary: string;
  /** Field name → value, with human-readable names ("Status", "Fee"). */
  before?: AuditFields;
  after?: AuditFields;
}

/** There's no INSERT policy on audit_logs for any authenticated role (by design —
 * nothing should be able to tamper with its own trail), so writing requires the
 * service-role client. Reads stay on the cookie-based client so RLS ("admin audit
 * logs") correctly limits this to ADMIN. */
export async function logAudit(actorId: string, action: string, entityType: string, entry: AuditEntryInput): Promise<void> {
  try {
    const admin = createAdminClient();
    // The role is stored as it is now, so a later promotion doesn't rewrite history.
    const { data: actor } = await admin.from("profiles").select("role").eq("id", actorId).maybeSingle();
    await admin.from("audit_logs").insert({
      actor_id: actorId,
      actor_role: actor?.role ?? null,
      action,
      entity_type: entityType,
      entity_id: entry.entityId ?? null,
      entity_label: entry.label ?? null,
      summary: entry.summary,
      before_data: (entry.before ?? null) as Json,
      after_data: (entry.after ?? null) as Json,
    });
  } catch {
    // Auditing must never block the actual operation it's recording.
  }
}

/** Keeps only the fields whose value changed, so an edit's entry lists just what was edited. */
export function changedFields(before: AuditFields, after: AuditFields): { before: AuditFields; after: AuditFields; names: string[] } {
  const names = Object.keys(after).filter((k) => JSON.stringify(before[k] ?? null) !== JSON.stringify(after[k] ?? null));
  return {
    before: Object.fromEntries(names.map((k) => [k, before[k] ?? null])),
    after: Object.fromEntries(names.map((k) => [k, after[k] ?? null])),
    names,
  };
}

/** "Name, Price and Stock" — for summaries of an edit. */
export function listNames(names: string[]): string {
  if (names.length <= 1) return names.join("");
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

// ---------- Reading

/** Each action's first word, which the audit page filters on. */
export const AUDIT_AREAS = {
  order: "Orders",
  product: "Products",
  delivery: "Delivery",
  deal: "Deals",
  collection: "Collections",
  category: "Categories",
  user: "Customers & Access",
  expense: "Expenses",
} as const;
export type AuditArea = keyof typeof AUDIT_AREAS;

/** Entries written before entries carried a sentence of their own. */
const LEGACY_LABELS: Record<string, string> = {
  "order.status_updated": "Updated an order's status",
  "product.created": "Created a product",
  "product.updated": "Updated a product",
  "product.deleted": "Deleted a product",
  "product.archived": "Archived a product",
  "product.image_added": "Added a product image",
  "product.image_removed": "Removed a product image",
  "deal.created": "Created a deal",
  "deal.updated": "Updated a deal",
  "deal.activated": "Activated a deal",
  "deal.deactivated": "Deactivated a deal",
  "deal.deleted": "Deleted a deal",
  "collection.created": "Created a collection",
  "collection.updated": "Updated a collection",
  "collection.deleted": "Deleted a collection",
  "category.created": "Created a category",
  "category.renamed": "Renamed a category",
  "category.shown": "Showed a category",
  "category.hidden": "Hid a category",
  "category.deleted": "Deleted a category",
  "user.role_changed": "Changed someone's role",
  "user.suspended": "Suspended an account",
  "user.reactivated": "Reactivated an account",
  "expense.created": "Recorded an expense",
  "content_block.saved": "Saved site content",
};

export interface AuditChange {
  field: string;
  before: AuditValue;
  after: AuditValue;
}

export interface AuditLogEntry {
  id: string;
  createdAt: string;
  actorId: string | null;
  actorName: string;
  actorRole: string | null;
  action: string;
  area: string;
  entityType: string;
  entityId: string | null;
  entityLabel: string | null;
  summary: string;
  changes: AuditChange[];
}

export interface AuditLogFilters {
  q?: string;
  actorId?: string;
  role?: "ADMIN" | "ASSISTANT";
  area?: AuditArea;
  /** YYYY-MM-DD, Nairobi time, inclusive. */
  from?: string;
  to?: string;
  sort?: "newest" | "oldest";
  page?: number;
}

export interface AuditLogPage {
  entries: AuditLogEntry[];
  total: number;
  page: number;
  pageSize: number;
}

const PAGE_SIZE = 50;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

function asFields(value: Json | null): AuditFields {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as AuditFields) : {};
}

function toChanges(before: AuditFields, after: AuditFields): AuditChange[] {
  const fields = [...new Set([...Object.keys(before), ...Object.keys(after)])];
  return fields.map((field) => ({ field, before: before[field] ?? null, after: after[field] ?? null }));
}

export async function getAuditLogs(filters: AuditLogFilters): Promise<AuditLogPage> {
  const supabase = await createClient();
  const page = Math.max(1, Math.floor(filters.page ?? 1));
  let query = supabase
    .from("audit_logs")
    .select("id, action, entity_type, entity_id, entity_label, summary, actor_id, actor_role, before_data, after_data, created_at, profiles ( full_name, role )", { count: "exact" });

  // Commas and brackets would break PostgREST's or() syntax; nobody searches for them.
  const q = (filters.q ?? "").replace(/[,()%*\\]/g, " ").trim();
  if (q) query = query.or(`summary.ilike.%${q}%,entity_label.ilike.%${q}%`);
  if (filters.actorId) query = query.eq("actor_id", filters.actorId);
  if (filters.role) query = query.eq("actor_role", filters.role);
  if (filters.area && filters.area in AUDIT_AREAS) query = query.like("action", `${filters.area}.%`);
  if (filters.from && DATE.test(filters.from)) query = query.gte("created_at", `${filters.from}T00:00:00+03:00`);
  if (filters.to && DATE.test(filters.to)) query = query.lte("created_at", `${filters.to}T23:59:59.999+03:00`);

  const { data, error, count } = await query
    .order("created_at", { ascending: filters.sort === "oldest" })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (error) throw error;

  // Staff whose profile has no name are shown by their sign-in email instead.
  const unnamed = (data ?? []).filter((l) => l.actor_id && !(l.profiles as unknown as { full_name: string | null } | null)?.full_name).map((l) => l.actor_id!);
  const emails = await emailsFor(unnamed);

  return {
    entries: (data ?? []).map((l) => {
      const profile = l.profiles as unknown as { full_name: string | null; role: string } | null;
      const before = asFields(l.before_data);
      const after = asFields(l.after_data);
      const legacyName = (after.name ?? after.title ?? before.name ?? before.title ?? null) as string | null;
      return {
        id: l.id,
        createdAt: l.created_at,
        actorId: l.actor_id,
        actorName: profile?.full_name || (l.actor_id && emails.get(l.actor_id)) || (l.actor_id ? (profile ? "Unnamed staff member" : "Former staff member") : "System"),
        actorRole: l.actor_role ?? profile?.role ?? null,
        action: l.action,
        area: AUDIT_AREAS[l.action.split(".")[0] as AuditArea] ?? "Other",
        entityType: l.entity_type,
        entityId: l.entity_id,
        entityLabel: l.entity_label ?? legacyName,
        summary: l.summary ?? `${LEGACY_LABELS[l.action] ?? l.action}${legacyName ? ` — ${legacyName}` : ""}`,
        changes: toChanges(before, after),
      };
    }),
    total: count ?? 0,
    page,
    pageSize: PAGE_SIZE,
  };
}

/** Sign-in emails for a few accounts (auth.users needs the service-role client). */
async function emailsFor(ids: string[]): Promise<Map<string, string>> {
  const unique = [...new Set(ids)];
  const found = new Map<string, string>();
  if (unique.length === 0) return found;
  try {
    const admin = createAdminClient();
    await Promise.all(
      unique.map(async (id) => {
        const { data } = await admin.auth.admin.getUserById(id);
        if (data?.user?.email) found.set(id, data.user.email);
      })
    );
  } catch {
    // Names are a nicety; the log still renders without them.
  }
  return found;
}

export interface AuditActor {
  id: string;
  name: string;
  role: string;
}

/** Everyone who can appear in the log: current staff (the "Person" filter). */
export async function getAuditActors(): Promise<AuditActor[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("profiles").select("id, full_name, role").in("role", ["ADMIN", "ASSISTANT"]).order("full_name");
  if (error) throw error;
  const emails = await emailsFor((data ?? []).filter((p) => !p.full_name).map((p) => p.id));
  return (data ?? []).map((p) => ({ id: p.id, name: p.full_name || emails.get(p.id) || "Unnamed staff member", role: p.role }));
}
