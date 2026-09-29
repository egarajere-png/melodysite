"use server";

import { revalidatePath } from "next/cache";
import { requireStaffId } from "@/lib/supabase/staff-auth";
import { CollectionError, createCollection, deleteCollection, getAdminCollections, updateCollection, type AdminCollection, type CollectionInput } from "@/lib/supabase/collections-admin";
import { logAudit } from "@/lib/supabase/audit-log";

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
    await logAudit(staffId, "collection.created", "collection", id, undefined, { name: data.name, products: data.productIds.length });
  }, "Could not create that collection.");
}

export async function updateCollectionAction(id: string, input: CollectionInput): Promise<AdminCollectionActionResult> {
  const data = clean(input);
  if (!data.name) return { ok: false, error: "Enter a collection name." };
  return run(async (staffId) => {
    await updateCollection(id, data);
    await logAudit(staffId, "collection.updated", "collection", id, undefined, { name: data.name, isActive: data.isActive, products: data.productIds.length });
  }, "Could not save that collection.");
}

export async function deleteCollectionAction(id: string, name: string): Promise<AdminCollectionActionResult> {
  return run(async (staffId) => {
    await deleteCollection(id);
    await logAudit(staffId, "collection.deleted", "collection", id, { name });
  }, "Could not delete that collection.");
}
