import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/database.types";

export interface AuditLogEntry {
  id: string;
  actorName: string;
  action: string;
  entityType: string;
  entityId: string | null;
  createdAt: string;
}

/** There's no INSERT policy on audit_logs for any authenticated role (by design —
 * nothing should be able to tamper with its own trail), so writing requires the
 * service-role client. Reads stay on the cookie-based client so RLS ("admin audit
 * logs") correctly limits this to ADMIN. */
export async function logAudit(actorId: string, action: string, entityType: string, entityId?: string, before?: object, after?: object): Promise<void> {
  try {
    const admin = createAdminClient();
    await admin.from("audit_logs").insert({
      actor_id: actorId,
      action,
      entity_type: entityType,
      entity_id: entityId ?? null,
      before_data: (before ?? null) as Json,
      after_data: (after ?? null) as Json,
    });
  } catch {
    // Auditing must never block the actual operation it's recording.
  }
}

export async function getAuditLogs(limit = 100): Promise<AuditLogEntry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("audit_logs")
    .select("id, action, entity_type, entity_id, created_at, profiles ( full_name )")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((l) => ({
    id: l.id,
    actorName: (l.profiles as unknown as { full_name: string | null } | null)?.full_name ?? "System",
    action: l.action,
    entityType: l.entity_type,
    entityId: l.entity_id,
    createdAt: l.created_at,
  }));
}
