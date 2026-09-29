"use server";

import { revalidatePath } from "next/cache";
import { requireStaffId } from "@/lib/supabase/staff-auth";
import { logAudit } from "@/lib/supabase/audit-log";
import { CategoryError, createCategory, deleteCategory, getAdminCategories, moveCategory, updateCategory, type AdminCategory } from "@/lib/supabase/categories-admin";

export type CategoryActionResult = { ok: true; categories: AdminCategory[]; moved?: number } | { ok: false; error: string };

async function run(work: (staffId: string) => Promise<number | void>, failure: string): Promise<CategoryActionResult> {
  const staffId = await requireStaffId();
  if (!staffId) return { ok: false, error: "You don't have permission to manage categories." };
  try {
    const moved = await work(staffId);
    // Categories feed the navbar/menu in the root layout, so refresh every page.
    revalidatePath("/", "layout");
    return { ok: true, categories: await getAdminCategories(), ...(typeof moved === "number" ? { moved } : {}) };
  } catch (e) {
    return { ok: false, error: e instanceof CategoryError ? e.message : failure };
  }
}

export async function createCategoryAction(name: string): Promise<CategoryActionResult> {
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, error: "Enter a category name." };
  return run(async (staffId) => {
    await createCategory(trimmed);
    await logAudit(staffId, "category.created", "category", undefined, undefined, { name: trimmed });
  }, "Could not create that category.");
}

export async function renameCategoryAction(id: string, name: string): Promise<CategoryActionResult> {
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, error: "Enter a category name." };
  return run(async (staffId) => {
    await updateCategory(id, { name: trimmed });
    await logAudit(staffId, "category.renamed", "category", id, undefined, { name: trimmed });
  }, "Could not rename that category.");
}

export async function setCategoryVisibleAction(id: string, visible: boolean): Promise<CategoryActionResult> {
  return run(async (staffId) => {
    await updateCategory(id, { isActive: visible });
    await logAudit(staffId, visible ? "category.shown" : "category.hidden", "category", id);
  }, "Could not update that category.");
}

export async function moveCategoryAction(id: string, direction: "up" | "down"): Promise<CategoryActionResult> {
  return run(() => moveCategory(id, direction), "Could not reorder categories.");
}

export async function deleteCategoryAction(id: string, moveProductsTo?: string): Promise<CategoryActionResult> {
  return run(async (staffId) => {
    const { moved } = await deleteCategory(id, moveProductsTo);
    await logAudit(staffId, "category.deleted", "category", id, undefined, { movedProductsTo: moveProductsTo ?? null, moved });
    return moved;
  }, "Could not delete that category.");
}
