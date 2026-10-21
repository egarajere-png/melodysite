"use server";

import { requireStaffId } from "@/lib/supabase/staff-auth";
import { OrderStatusError, setOrderTrackingCode, updateOrderStatus } from "@/lib/supabase/orders-admin";
import { logAudit } from "@/lib/supabase/audit-log";
import { queueOrderStatusNotification } from "@/lib/notifications/order-notifications";
import { STEP_LABELS } from "@/components/orders/OrderTimeline";
import type { OrderStatus } from "@/lib/supabase/database.types";

export type UpdateOrderStatusResult = { ok: true } | { ok: false; error: string };

export async function updateOrderStatusAction(orderId: string, status: OrderStatus, note?: string): Promise<UpdateOrderStatusResult> {
  const staffId = await requireStaffId();
  if (!staffId) return { ok: false, error: "You don't have permission to update orders." };
  try {
    const { previous, orderNumber } = await updateOrderStatus(orderId, staffId, status, note);
    const changed = previous !== status;
    // Re-saving the same status (e.g. to add a note) doesn't message the customer again.
    if (changed) queueOrderStatusNotification(orderId, status);
    const order = orderNumber ?? "an order";
    const from = previous ? STEP_LABELS[previous] : null;
    await logAudit(staffId, changed ? "order.status_updated" : "order.note_added", "order", {
      entityId: orderId,
      label: orderNumber ?? undefined,
      summary: changed
        ? `Changed order ${order} from "${from ?? "—"}" to "${STEP_LABELS[status]}"`
        : `Added a note to order ${order} (still "${STEP_LABELS[status]}")`,
      before: changed ? { Status: from } : undefined,
      after: { ...(changed ? { Status: STEP_LABELS[status] } : {}), ...(note ? { Note: note } : {}) },
    });
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof OrderStatusError ? error.message : "Could not update the order status." };
  }
}

export async function saveTrackingCodeAction(orderId: string, code: string): Promise<UpdateOrderStatusResult> {
  const staffId = await requireStaffId();
  if (!staffId) return { ok: false, error: "You don't have permission to update orders." };
  const trimmed = code.trim().slice(0, 80);
  try {
    const { previous, orderNumber } = await setOrderTrackingCode(orderId, trimmed);
    if ((previous ?? "") !== trimmed) {
      await logAudit(staffId, "order.tracking_updated", "order", {
        entityId: orderId,
        label: orderNumber,
        summary: trimmed
          ? `${previous ? "Changed" : "Added"} the Pick Up Mtaani tracking code on order ${orderNumber}`
          : `Removed the Pick Up Mtaani tracking code from order ${orderNumber}`,
        before: { "Tracking code": previous },
        after: { "Tracking code": trimmed || null },
      });
    }
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof OrderStatusError ? error.message : "Could not save the tracking code." };
  }
}
