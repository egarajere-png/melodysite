"use server";

import { requireStaffId } from "@/lib/supabase/staff-auth";
import { OrderStatusError, updateOrderStatus } from "@/lib/supabase/orders-admin";
import { logAudit } from "@/lib/supabase/audit-log";
import { queueOrderStatusNotification } from "@/lib/notifications/order-notifications";
import type { OrderStatus } from "@/lib/supabase/database.types";

export type UpdateOrderStatusResult = { ok: true } | { ok: false; error: string };

export async function updateOrderStatusAction(orderId: string, status: OrderStatus, note?: string): Promise<UpdateOrderStatusResult> {
  const staffId = await requireStaffId();
  if (!staffId) return { ok: false, error: "You don't have permission to update orders." };
  try {
    const previous = await updateOrderStatus(orderId, staffId, status, note);
    // Re-saving the same status (e.g. to add a note) doesn't message the customer again.
    if (previous !== status) queueOrderStatusNotification(orderId, status);
    await logAudit(staffId, "order.status_updated", "order", orderId, undefined, { status, note });
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof OrderStatusError ? error.message : "Could not update the order status." };
  }
}
