"use server";

import { requireStaffId } from "@/lib/supabase/staff-auth";
import { createProduct, deleteProduct, getAdminProduct, updateProduct, type AdminProductInput, type DeleteProductOutcome } from "@/lib/supabase/products-admin";
import { changedFields, listNames, logAudit, type AuditFields } from "@/lib/supabase/audit-log";
import { formatKES } from "@/lib/format";

function clip(text: string, max = 140) {
  const t = text.trim();
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
}

/** The parts of a product staff care about in the log, as they'd read them. */
function productFields(p: AdminProductInput): AuditFields {
  return {
    Name: p.name.trim(),
    Price: formatKES(p.price),
    "Cost price": formatKES(p.costPrice),
    Category: p.category,
    Collections: p.collections.join(", ") || "None",
    Materials: p.materials.join(", ") || "None",
    Description: clip(p.description),
    "Care instructions": clip(p.careInstructions),
    "Shipping info": clip(p.shippingInfo),
    "Returns info": clip(p.returnsInfo),
    "Variants & stock": p.variants.map((v) => `${[v.colour, v.size].filter(Boolean).join(" / ") || v.sku}: ${v.stock}`).join(", ") || "None",
  };
}

export type SaveProductResult = { ok: true; id: string } | { ok: false; error: string };

export async function createProductAction(input: AdminProductInput): Promise<SaveProductResult> {
  const staffId = await requireStaffId();
  if (!staffId) return { ok: false, error: "You don't have permission to create products." };
  try {
    const id = await createProduct(input);
    await logAudit(staffId, "product.created", "product", {
      entityId: id,
      label: input.name.trim(),
      summary: `Created product "${input.name.trim()}" at ${formatKES(input.price)}`,
      after: productFields(input),
    });
    return { ok: true, id };
  } catch {
    return { ok: false, error: "Could not create that product." };
  }
}

export async function updateProductAction(id: string, input: AdminProductInput): Promise<SaveProductResult> {
  const staffId = await requireStaffId();
  if (!staffId) return { ok: false, error: "You don't have permission to edit products." };
  try {
    const previous = await getAdminProduct(id).catch(() => null);
    await updateProduct(id, input);
    const diff = previous ? changedFields(productFields(previous), productFields(input)) : null;
    await logAudit(staffId, "product.updated", "product", {
      entityId: id,
      label: input.name.trim(),
      summary: diff?.names.length ? `Edited product "${input.name.trim()}" — changed ${listNames(diff.names)}` : `Saved product "${input.name.trim()}" (no changes)`,
      before: diff?.before,
      after: diff ? diff.after : productFields(input),
    });
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
    await logAudit(staffId, outcome === "deleted" ? "product.deleted" : "product.archived", "product", {
      entityId: id,
      label: name,
      summary: outcome === "deleted" ? `Deleted product "${name}"` : `Archived product "${name}" (it has past orders, so it was hidden instead of deleted)`,
    });
    return { ok: true, outcome };
  } catch {
    return { ok: false, error: `Could not delete ${name}.` };
  }
}
