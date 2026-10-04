import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { storedImageRef } from "@/lib/product-media";
import type { OrderStatus, FulfilmentMethod } from "@/lib/supabase/database.types";
import type { ImageRef } from "@/lib/types";

/**
 * Customer-facing order reads. RLS ("own orders or staff") restricts every query
 * here to the calling user's own orders, so the normal cookie-based client is
 * sufficient — no service-role access needed for reads.
 */

export interface OrderSummary {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  fulfilment: FulfilmentMethod;
  total: number;
  createdAt: string;
}

export interface OrderItemView {
  id: string;
  name: string;
  variantLabel: string;
  sku: string | null;
  quantity: number;
  unitPrice: number;
  image: ImageRef;
}

export interface OrderStatusEvent {
  status: OrderStatus;
  timestamp: string;
  note: string | null;
}

export interface OrderDetail extends OrderSummary {
  subtotal: number;
  shippingTotal: number;
  items: OrderItemView[];
  history: OrderStatusEvent[];
  personalizedMessage: { recipientName: string; message: string } | null;
  shippingAddress: Record<string, string> | null;
  /** Phone given at checkout — the default number for paying by M-Pesa. */
  contactPhone: string | null;
}

export function itemImageFromPath(imagePath: string | null, name: string): ImageRef {
  return storedImageRef(name, imagePath, name);
}

export async function getCustomerOrders(customerId: string): Promise<OrderSummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select("id, order_number, status, fulfilment, total, created_at")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((o) => ({
    id: o.id,
    orderNumber: o.order_number,
    status: o.status,
    fulfilment: o.fulfilment,
    total: Number(o.total),
    createdAt: o.created_at,
  }));
}

/** Looks up an order by its human-facing order number (e.g. "AE-9016FBAB"), scoped
 * to RLS — a customer can only ever find their own orders this way, staff can find any. */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ORDER_DETAIL_SELECT = "id, order_number, status, fulfilment, subtotal, shipping_total, total, created_at, shipping_address, contact_phone";

/**
 * Guests have no session for RLS to match, so their order is opened with its
 * access_token (a random UUID in their order link). Both the order number and the
 * token must match, and the lookup runs server-side with the service-role client.
 */
export async function getOrderByNumber(orderNumber: string, accessToken?: string): Promise<OrderDetail | null> {
  const rls = await createClient();
  const { data: own, error } = await rls.from("orders").select(ORDER_DETAIL_SELECT).eq("order_number", orderNumber).maybeSingle();
  if (error) throw error;

  let order = own;
  let supabase: ReturnType<typeof createAdminClient> | Awaited<ReturnType<typeof createClient>> = rls;
  if (!order && accessToken && UUID.test(accessToken)) {
    const admin = createAdminClient();
    const { data: viaToken } = await admin.from("orders").select(ORDER_DETAIL_SELECT).eq("order_number", orderNumber).eq("access_token", accessToken).maybeSingle();
    order = viaToken;
    supabase = admin;
  }
  if (!order) return null;

  const [{ data: items }, { data: history }, { data: message }] = await Promise.all([
    supabase.from("order_items").select("id, product_name, variant_name, sku, quantity, unit_price, image_path").eq("order_id", order.id),
    supabase.from("order_status_history").select("status, note, created_at").eq("order_id", order.id).order("created_at"),
    supabase.from("order_personalized_messages").select("recipient_name, message").eq("order_id", order.id).maybeSingle(),
  ]);

  return {
    id: order.id,
    orderNumber: order.order_number,
    status: order.status,
    fulfilment: order.fulfilment,
    subtotal: Number(order.subtotal),
    shippingTotal: Number(order.shipping_total),
    total: Number(order.total),
    createdAt: order.created_at,
    shippingAddress: order.shipping_address as Record<string, string> | null,
    contactPhone: order.contact_phone,
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

/** "Track your order" for guests: order number + the email used at checkout. Returns
 * the order's access token only when both match, so order numbers alone reveal nothing. */
export async function findGuestOrderToken(orderNumber: string, email: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("orders")
    .select("access_token, contact_email")
    .eq("order_number", orderNumber.trim().toUpperCase())
    .maybeSingle();
  if (!data?.contact_email || data.contact_email.trim().toLowerCase() !== email.trim().toLowerCase()) return null;
  return data.access_token;
}
