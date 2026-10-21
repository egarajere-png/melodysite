"use server";

import { revalidatePath } from "next/cache";
import { requireStaffId } from "@/lib/supabase/staff-auth";
import { CollectionError, createCollection, deleteCollection, getAdminCollections, updateCollection, type AdminCollection, type CollectionInput } from "@/lib/supabase/collections-admin";
import { changedFields, listNames, logAudit, type AuditFields } from "@/lib/supabase/audit-log";

function collectionFields(c: CollectionInput | AdminCollection): AuditFields {
  return { Name: c.name.trim(), Description: (c.description ?? "").trim() || "None", Visible: c.isActive ? "Yes" : "No", Products: c.productIds.length };
}

export type AdminCollectionActionResult = { ok: true; collections: AdminCollection[] } | { ok: false; error: string };

async function run(work: (staffId: string) => Promise<void>, failure: string): Promise<AdminCollectionActionResult> {
  const staffId = await requireStaffId();
  if (!staffId) return { ok: false, error: "You don't have permission to manage collections." };
  try {
    await work(staffId);
    revalidatePath("/", "layout");
    return { ok: true, collections: await getAdminCollections() };
  } catch (e) {
    return { ok: false, error: e instanceof CollectionError ? e.message : failure };
  }
}

function clean(input: CollectionInput): CollectionInput {
  return { ...input, name: input.name.trim(), description: input.description.trim() };
}

export async function createCollectionAction(input: CollectionInput): Promise<AdminCollectionActionResult> {
  const data = clean(input);
  if (!data.name) return { ok: false, error: "Enter a collection name." };
  return run(async (staffId) => {
    const id = await createCollection(data);
    await logAudit(staffId, "collection.created", "collection", {
      entityId: id,
      label: data.name,
      summary: `Created collection "${data.name}" with ${data.productIds.length} product${data.productIds.length === 1 ? "" : "s"}`,
      after: collectionFields(data),
    });
  }, "Could not create that collection.");
}

export async function updateCollectionAction(id: string, input: CollectionInput): Promise<AdminCollectionActionResult> {
  const data = clean(input);
  if (!data.name) return { ok: false, error: "Enter a collection name." };
  return run(async (staffId) => {
    const previous = (await getAdminCollections().catch(() => [])).find((c) => c.id === id) ?? null;
    await updateCollection(id, data);
    const diff = previous ? changedFields(collectionFields(previous), collectionFields(data)) : null;
    await logAudit(staffId, "collection.updated", "collection", {
      entityId: id,
      label: data.name,
      summary: diff?.names.length ? `Edited collection "${data.name}" — changed ${listNames(diff.names)}` : `Saved collection "${data.name}" (no changes)`,
      before: diff?.before,
      after: diff ? diff.after : collectionFields(data),
    });
  }, "Could not save that collection.");
}

export async function deleteCollectionAction(id: string, name: string): Promise<AdminCollectionActionResult> {
  return run(async (staffId) => {
    await deleteCollection(id);
    await logAudit(staffId, "collection.deleted", "collection", { entityId: id, label: name, summary: `Deleted collection "${name}"` });
  }, "Could not delete that collection.");
}
