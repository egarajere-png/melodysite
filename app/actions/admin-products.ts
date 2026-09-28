"use server";

import { requireStaffId } from "@/lib/supabase/staff-auth";
import { createProduct, updateProduct, type AdminProductInput } from "@/lib/supabase/products-admin";
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
