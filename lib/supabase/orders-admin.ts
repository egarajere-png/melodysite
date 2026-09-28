import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { OrderStatus, FulfilmentMethod } from "@/lib/supabase/database.types";
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
  status: OrderStatus;
  fulfilment: FulfilmentMethod;
  total: number;
  createdAt: string;
}

export interface AdminOrderDetail extends AdminOrderSummary {
  customerEmail: string | null;
  customerPhone: string | null;
  subtotal: number;
  shippingTotal: number;
  shippingAddress: Record<string, string> | null;
  items: OrderItemView[];
  history: OrderStatusEvent[];
  personalizedMessage: { recipientName: string; message: string } | null;
}

export async function getAllOrdersForAdmin(): Promise<AdminOrderSummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select("id, order_number, status, fulfilment, total, created_at, profiles ( full_name )")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((o) => ({
    id: o.id,
    orderNumber: o.order_number,
    customerName: (o.profiles as unknown as { full_name: string | null } | null)?.full_name ?? "—",
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
      "id, order_number, status, fulfilment, subtotal, shipping_total, total, created_at, shipping_address, customer_id, profiles ( full_name, phone )"
    )
    .eq("order_number", orderNumber)
    .maybeSingle();
  if (error) throw error;
  if (!order) return null;

  const [{ data: items }, { data: history }, { data: message }] = await Promise.all([
    supabase.from("order_items").select("id, product_name, variant_name, sku, quantity, unit_price, image_path").eq("order_id", order.id),
    supabase.from("order_status_history").select("status, note, created_at").eq("order_id", order.id).order("created_at"),
    supabase.from("order_personalized_messages").select("recipient_name, message").eq("order_id", order.id).maybeSingle(),
  ]);

  let customerEmail: string | null = null;
  try {
    const admin = createAdminClient();
    const { data: authUser } = await admin.auth.admin.getUserById(order.customer_id);
    customerEmail = authUser?.user?.email ?? null;
  } catch {
    customerEmail = null;
  }

  const profile = order.profiles as unknown as { full_name: string | null; phone: string | null } | null;

  return {
    id: order.id,
    orderNumber: order.order_number,
    customerName: profile?.full_name ?? "—",
    customerEmail,
    customerPhone: profile?.phone ?? null,
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
  };
}

export async function updateOrderStatus(orderId: string, staffId: string, status: OrderStatus, note?: string): Promise<void> {
  const supabase = await createClient();
  const { error: updateErr } = await supabase.from("orders").update({ status }).eq("id", orderId);
  if (updateErr) throw updateErr;

  const { error: historyErr } = await supabase
    .from("order_status_history")
    .insert({ order_id: orderId, status, note: note || null, actor_id: staffId });
  if (historyErr) throw historyErr;
}
