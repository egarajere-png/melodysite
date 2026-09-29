"use server";

import { requireStaffId } from "@/lib/supabase/staff-auth";
import { createProduct, deleteProduct, updateProduct, type AdminProductInput, type DeleteProductOutcome } from "@/lib/supabase/products-admin";
import { logAudit } from "@/lib/supabase/audit-log";

export type SaveProductResult = { ok: true; id: string } | { ok: false; error: string };

export async function createProductAction(input: AdminProductInput): Promise<SaveProductResult> {
  const staffId = await requireStaffId();
  if (!staffId) return { ok: false, error: "You don't have permission to create products." };
  try {
    const id = await createProduct(input);
    await logAudit(staffId, "product.created", "product", id, undefined, { name: input.name, price: input.price });
    return { ok: true, id };
  } catch {
    return { ok: false, error: "Could not create that product." };
  }
}

export async function updateProductAction(id: string, input: AdminProductInput): Promise<SaveProductResult> {
  const staffId = await requireStaffId();
  if (!staffId) return { ok: false, error: "You don't have permission to edit products." };
  try {
    await updateProduct(id, input);
    await logAudit(staffId, "product.updated", "product", id, undefined, { name: input.name, price: input.price });
    return { ok: true, id };
  } catch {
    return { ok: false, error: "Could not save those changes." };
  }
}

export type DeleteProductResult = { ok: true; outcome: DeleteProductOutcome } | { ok: false; error: string };

export async function deleteProductAction(id: string, name: string): Promise<DeleteProductResult> {
  const staffId = await requireStaffId();
  if (!staffId) return { ok: false, error: "You don't have permission to delete products." };
  try {
    const outcome = await deleteProduct(id);
    await logAudit(staffId, outcome === "deleted" ? "product.deleted" : "product.archived", "product", id, { name });
    return { ok: true, outcome };
  } catch {
    return { ok: false, error: `Could not delete ${name}.` };
  }
}
