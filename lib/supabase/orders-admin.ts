import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { OrderStatus, FulfilmentMethod, PaymentStatus } from "@/lib/supabase/database.types";
import type { OrderItemView, OrderStatusEvent } from "@/lib/supabase/orders-customer";
import { itemImageFromPath } from "@/lib/supabase/orders-customer";

/**
 * Staff order reads/writes. RLS already grants is_staff() full read on orders and
 * insert on order_status_history, and update on orders, so the cookie-based client
 * (carrying the staff member's own session) is sufficient for everything except
 * looking up a customer's email, which lives in auth.users and needs the
 * service-role client.
 */

export interface AdminOrderSummary {
  id: string;
  orderNumber: string;
  customerName: string;
  /** Placed without an account (guest checkout). */
  isGuest: boolean;
  status: OrderStatus;
  fulfilment: FulfilmentMethod;
  total: number;
  createdAt: string;
}

export interface AdminOrderDetail extends AdminOrderSummary {
  customerEmail: string | null;
  customerPhone: string | null;
  /** Given at checkout for this order — preferred over the account email/phone. */
  contactEmail: string | null;
  contactPhone: string | null;
  subtotal: number;
  shippingTotal: number;
  shippingAddress: Record<string, string> | null;
  items: OrderItemView[];
  history: OrderStatusEvent[];
  personalizedMessage: { recipientName: string; message: string } | null;
  /** M-Pesa attempts for this order, newest first. */
  payments: AdminOrderPayment[];
  /** Emails and WhatsApp messages sent about this order, newest first. */
  notifications: AdminOrderNotification[];
}

export interface AdminOrderNotification {
  id: string;
  channel: string;
  eventType: string;
  recipient: string;
  status: string;
  error: string | null;
  createdAt: string;
}

export interface AdminOrderPayment {
  id: string;
  status: PaymentStatus;
  amount: number;
  phone: string | null;
  receipt: string | null;
  failureReason: string | null;
  createdAt: string;
}

export async function getAllOrdersForAdmin(): Promise<AdminOrderSummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select("id, order_number, status, fulfilment, total, created_at, customer_id, contact_name, profiles ( full_name )")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((o) => ({
    id: o.id,
    orderNumber: o.order_number,
    // The name typed at checkout is what staff should see; fall back to the account's.
    customerName: o.contact_name || (o.profiles as unknown as { full_name: string | null } | null)?.full_name || "—",
    isGuest: !o.customer_id,
    status: o.status,
    fulfilment: o.fulfilment,
    total: Number(o.total),
    createdAt: o.created_at,
  }));
}

export async function getOrderForAdmin(orderNumber: string): Promise<AdminOrderDetail | null> {
  const supabase = await createClient();
  const { data: order, error } = await supabase
    .from("orders")
    .select(
      "id, order_number, status, fulfilment, subtotal, shipping_total, total, created_at, shipping_address, contact_name, contact_email, contact_phone, customer_id, profiles ( full_name, phone )"
    )
    .eq("order_number", orderNumber)
    .maybeSingle();
  if (error) throw error;
  if (!order) return null;

  const [{ data: items }, { data: history }, { data: message }, { data: payments }, { data: notifications }] = await Promise.all([
    supabase.from("order_items").select("id, product_name, variant_name, sku, quantity, unit_price, image_path").eq("order_id", order.id),
    supabase.from("order_status_history").select("status, note, created_at").eq("order_id", order.id).order("created_at"),
    supabase.from("order_personalized_messages").select("recipient_name, message").eq("order_id", order.id).maybeSingle(),
    supabase.from("payments").select("id, status, amount, phone, receipt_number, failure_reason, created_at").eq("order_id", order.id).order("created_at", { ascending: false }),
    supabase.from("email_messages").select("id, channel, event_type, recipient, status, error, created_at").eq("order_id", order.id).order("created_at", { ascending: false }).limit(40),
  ]);

  let customerEmail: string | null = null;
  if (order.customer_id) {
    try {
      const admin = createAdminClient();
      const { data: authUser } = await admin.auth.admin.getUserById(order.customer_id);
      customerEmail = authUser?.user?.email ?? null;
    } catch {
      customerEmail = null;
    }
  }

  const profile = order.profiles as unknown as { full_name: string | null; phone: string | null } | null;

  return {
    id: order.id,
    orderNumber: order.order_number,
    customerName: order.contact_name || profile?.full_name || "—",
    isGuest: !order.customer_id,
    customerEmail,
    customerPhone: profile?.phone ?? null,
    contactEmail: order.contact_email,
    contactPhone: order.contact_phone,
    status: order.status,
    fulfilment: order.fulfilment,
    subtotal: Number(order.subtotal),
    shippingTotal: Number(order.shipping_total),
    total: Number(order.total),
    createdAt: order.created_at,
    shippingAddress: order.shipping_address as Record<string, string> | null,
    items: (items ?? []).map((i) => ({
      id: i.id,
      name: i.product_name,
      variantLabel: i.variant_name,
      sku: i.sku,
      quantity: i.quantity,
      unitPrice: Number(i.unit_price),
      image: itemImageFromPath(i.image_path, i.product_name),
    })),
    history: (history ?? []).map((h) => ({ status: h.status, timestamp: h.created_at, note: h.note })),
    personalizedMessage: message ? { recipientName: message.recipient_name, message: message.message } : null,
    payments: (payments ?? []).map((p) => ({
      id: p.id,
      status: p.status,
      amount: Number(p.amount),
      phone: p.phone,
      receipt: p.receipt_number,
      failureReason: p.failure_reason,
      createdAt: p.created_at,
    })),
    notifications: (notifications ?? []).map((n) => ({
      id: n.id,
      channel: n.channel,
      eventType: n.event_type,
      recipient: n.recipient,
      status: n.status,
      error: n.error,
      createdAt: n.created_at,
    })),
  };
}

/** A status change staff can't make right now; its message is safe to show them as-is. */
export class OrderStatusError extends Error {}

async function moveOrderStock(supabase: Awaited<ReturnType<typeof createClient>>, orderId: string, direction: "release" | "reserve"): Promise<void> {
  const { data: items, error } = await supabase.from("order_items").select("variant_id, quantity, product_name").eq("order_id", orderId);
  if (error) throw error;
  const taken: { variant_id: string; quantity: number }[] = [];
  for (const item of items ?? []) {
    if (!item.variant_id) continue; // the variant was deleted since; nothing to adjust
    if (direction === "release") {
      const { error: releaseErr } = await supabase.rpc("release_variant_stock", { p_variant_id: item.variant_id, p_quantity: item.quantity });
      if (releaseErr) throw releaseErr;
      continue;
    }
    const { data: ok, error: reserveErr } = await supabase.rpc("reserve_variant_stock", { p_variant_id: item.variant_id, p_quantity: item.quantity });
    if (reserveErr || !ok) {
      for (const t of taken) await supabase.rpc("release_variant_stock", { p_variant_id: t.variant_id, p_quantity: t.quantity });
      if (reserveErr) throw reserveErr;
      throw new OrderStatusError(`"${item.product_name}" no longer has enough stock to reopen this order.`);
    }
    taken.push({ variant_id: item.variant_id, quantity: item.quantity });
  }
}

/** Returns the status the order had before, so callers can tell a real change from a re-save. */
export async function updateOrderStatus(orderId: string, staffId: string, status: OrderStatus, note?: string): Promise<OrderStatus | null> {
  const supabase = await createClient();
  const { data: before } = await supabase.from("orders").select("status").eq("id", orderId).maybeSingle();

  // A cancelled order gives its pieces back to the shop; un-cancelling takes them
  // again, and is refused if they've since sold.
  const wasCancelled = before?.status === "CANCELLED";
  if (before && wasCancelled !== (status === "CANCELLED")) await moveOrderStock(supabase, orderId, status === "CANCELLED" ? "release" : "reserve");

  const { error: updateErr } = await supabase.from("orders").update({ status }).eq("id", orderId);
  if (updateErr) throw updateErr;

  const { error: historyErr } = await supabase
    .from("order_status_history")
    .insert({ order_id: orderId, status, note: note || null, actor_id: staffId });
  if (historyErr) throw historyErr;
  return before?.status ?? null;
}
