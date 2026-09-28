"use server";

import { requireStaffId } from "@/lib/supabase/staff-auth";
import { updateOrderStatus } from "@/lib/supabase/orders-admin";
import { logAudit } from "@/lib/supabase/audit-log";
import type { OrderStatus } from "@/lib/supabase/database.types";

export type UpdateOrderStatusResult = { ok: true } | { ok: false; error: string };

export async function updateOrderStatusAction(orderId: string, status: OrderStatus, note?: string): Promise<UpdateOrderStatusResult> {
  const staffId = await requireStaffId();
  if (!staffId) return { ok: false, error: "You don't have permission to update orders." };
  try {
    await updateOrderStatus(orderId, staffId, status, note);
    await logAudit(staffId, "order.status_updated", "order", orderId, undefined, { status, note });
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not update the order status." };
  }
}
