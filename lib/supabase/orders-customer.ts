import { createClient } from "@/lib/supabase/server";
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
}

export function itemImageFromPath(imagePath: string | null, name: string): ImageRef {
  if (!imagePath) return { id: name, alt: name, kind: "product", tone: "sand" };
  if (imagePath.startsWith("placeholder:")) {
    const [, kind, tone, id] = imagePath.split(":");
    return { id, alt: name, kind: (kind as ImageRef["kind"]) ?? "product", tone: (tone as ImageRef["tone"]) ?? "sand" };
  }
  if (imagePath.startsWith("http")) return { id: name, alt: name, kind: "product", url: imagePath };
  return { id: name, alt: name, kind: "product", url: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-media/${imagePath}` };
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
export async function getOrderByNumber(orderNumber: string): Promise<OrderDetail | null> {
  const supabase = await createClient();
  const { data: order, error } = await supabase
    .from("orders")
    .select("id, order_number, status, fulfilment, subtotal, shipping_total, total, created_at, shipping_address")
    .eq("order_number", orderNumber)
    .maybeSingle();
  if (error) throw error;
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
