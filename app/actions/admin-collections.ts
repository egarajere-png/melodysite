"use server";

import { requireStaffId } from "@/lib/supabase/staff-auth";
import { createCollection, deactivateCollection } from "@/lib/supabase/collections-admin";
import { logAudit } from "@/lib/supabase/audit-log";

export type AdminCollectionActionResult = { ok: true } | { ok: false; error: string };

export async function createCollectionAction(name: string, description: string): Promise<AdminCollectionActionResult> {
  const staffId = await requireStaffId();
  if (!staffId) return { ok: false, error: "You don't have permission to manage collections." };
  try {
    await createCollection(name, description);
    await logAudit(staffId, "collection.created", "collection", undefined, undefined, { name });
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not create that collection." };
  }
}

export async function deactivateCollectionAction(id: string): Promise<AdminCollectionActionResult> {
  const staffId = await requireStaffId();
  if (!staffId) return { ok: false, error: "You don't have permission to manage collections." };
  try {
    await deactivateCollection(id);
    await logAudit(staffId, "collection.deactivated", "collection", id);
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not remove that collection." };
  }
}
