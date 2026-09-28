"use server";

import { requireAdminId } from "@/lib/supabase/staff-auth";
import { upsertContentBlock } from "@/lib/supabase/content-admin";
import { logAudit } from "@/lib/supabase/audit-log";

export type AdminContentActionResult = { ok: true } | { ok: false; error: string };

export async function saveContentBlockAction(key: string, contentJson: string): Promise<AdminContentActionResult> {
  const adminId = await requireAdminId();
  if (!adminId) return { ok: false, error: "You don't have permission to edit content." };
  if (!key.trim()) return { ok: false, error: "Give this block a key." };

  let parsed: unknown;
  try {
    parsed = JSON.parse(contentJson);
  } catch {
    return { ok: false, error: "Content must be valid JSON." };
  }

  try {
    await upsertContentBlock(adminId, key.trim(), parsed);
    await logAudit(adminId, "content_block.saved", "content_block", undefined, undefined, { key: key.trim() });
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not save that content block." };
  }
}
