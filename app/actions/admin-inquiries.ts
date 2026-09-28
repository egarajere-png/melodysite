"use server";

import { requireStaffId } from "@/lib/supabase/staff-auth";
import { updateInquiryStatus, type InquiryStatus } from "@/lib/supabase/inquiries";

export type UpdateInquiryResult = { ok: true } | { ok: false; error: string };

export async function updateInquiryStatusAction(id: string, status: InquiryStatus): Promise<UpdateInquiryResult> {
  if (!(await requireStaffId())) return { ok: false, error: "You don't have permission to update inquiries." };
  try {
    await updateInquiryStatus(id, status);
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not update that inquiry." };
  }
}
