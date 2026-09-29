"use server";

import { revalidatePath } from "next/cache";
import { requireStaffId } from "@/lib/supabase/staff-auth";
import { logAudit } from "@/lib/supabase/audit-log";
import {
  addProductMedia,
  deleteProductMedia,
  discardUploadedFile,
  getAdminProductMedia,
  moveProductMediaFirst,
  type AddMediaInput,
  type AdminProductMedia,
} from "@/lib/supabase/product-media-admin";

export type ProductMediaActionResult = { ok: true; media: AdminProductMedia } | { ok: false; error: string };

async function withStaff(productId: string, run: (staffId: string) => Promise<void>, failure: string): Promise<ProductMediaActionResult> {
  const staffId = await requireStaffId();
  if (!staffId) return { ok: false, error: "You don't have permission to manage product images." };
  try {
    await run(staffId);
    revalidatePath("/shop", "layout");
    return { ok: true, media: await getAdminProductMedia(productId) };
  } catch (e) {
    return { ok: false, error: e instanceof Error && e.message ? e.message : failure };
  }
}

export async function addProductMediaAction(input: AddMediaInput): Promise<ProductMediaActionResult> {
  const result = await withStaff(
    input.productId,
    async (staffId) => {
      await addProductMedia(input);
      await logAudit(staffId, "product.image_added", "product", input.productId, undefined, { slot: input.slot, path: input.storagePath });
    },
    "Could not save that image."
  );
  if (!result.ok) await discardUploadedFile(input.productId, input.storagePath);
  return result;
}

export async function deleteProductMediaAction(productId: string, mediaId: string): Promise<ProductMediaActionResult> {
  return withStaff(
    productId,
    async (staffId) => {
      await deleteProductMedia(productId, mediaId);
      await logAudit(staffId, "product.image_removed", "product", productId, { mediaId });
    },
    "Could not remove that image."
  );
}

export async function moveProductMediaFirstAction(productId: string, mediaId: string): Promise<ProductMediaActionResult> {
  return withStaff(productId, () => moveProductMediaFirst(productId, mediaId), "Could not reorder that image.");
}
