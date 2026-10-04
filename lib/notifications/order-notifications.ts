import { after } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatKES } from "@/lib/format";
import type { DeliverySnapshot, PickupSnapshot } from "@/lib/delivery";
import type { OrderStatus } from "@/lib/supabase/database.types";
import { ADMIN_PAID_ORDER, CUSTOMER_MESSAGES, renderMessage, type AdminMessageContext, type CustomerMessageContext, type MessageDefinition } from "@/lib/notifications/messages";
import { sendEmail, type EmailLine } from "@/lib/notifications/email";
import { sendWhatsappTemplate, type SendResult } from "@/lib/notifications/whatsapp";

/**
 * Tells the customer (and, for a new paid order, the shop's admins) what just happened
 * to an order, by email and WhatsApp. Sending runs after the response has gone out and
 * never throws: a notification that fails must not undo a payment or a status change.
 * Every attempt is recorded in email_messages.
 */

type Admin = ReturnType<typeof createAdminClient>;

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://aurumentonet.co.ke").replace(/\/+$/, "");

function list(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

interface LoadedOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  email: string | null;
  phone: string | null;
  total: number;
  receipt: string | null;
  destination: string;
  fulfilmentLine: string;
  orderUrl: string;
  adminUrl: string;
  itemsLine: string;
  lines: EmailLine[];
  totals: EmailLine[];
}

async function loadOrder(admin: Admin, orderId: string): Promise<LoadedOrder | null> {
  const { data: order } = await admin
    .from("orders")
    .select("id, order_number, access_token, fulfilment, shipping_address, contact_name, contact_email, contact_phone, customer_id, subtotal, shipping_total, total")
    .eq("id", orderId)
    .maybeSingle();
  if (!order) return null;

  const [{ data: items }, { data: payment }] = await Promise.all([
    admin.from("order_items").select("product_name, variant_name, quantity, unit_price").eq("order_id", orderId),
    admin.from("payments").select("receipt_number").eq("order_id", orderId).eq("status", "SUCCEEDED").order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);

  // Orders placed before checkout asked for an email fall back to the account's.
  let email = order.contact_email;
  if (!email && order.customer_id) {
    const { data } = await admin.auth.admin.getUserById(order.customer_id);
    email = data?.user?.email ?? null;
  }

  const snapshot = (order.shipping_address ?? {}) as Partial<DeliverySnapshot> & Partial<PickupSnapshot>;
  const isPickup = order.fulfilment === "COLLECTION";
  const destination = isPickup
    ? [snapshot.pickup_name, snapshot.pickup_address].filter(Boolean).join(", ") || "our pickup point"
    : [snapshot.location, snapshot.area].filter(Boolean).join(", ") || "your delivery address";

  return {
    id: order.id,
    orderNumber: order.order_number,
    customerName: order.contact_name || "Customer",
    email,
    phone: order.contact_phone,
    total: Number(order.total),
    receipt: payment?.receipt_number ?? null,
    destination,
    fulfilmentLine: `${isPickup ? "Pickup at" : "Delivery to"} ${destination}`,
    orderUrl: `${SITE_URL}/orders/${order.order_number}?t=${order.access_token}`,
    adminUrl: `${SITE_URL}/admin/orders/${order.order_number}`,
    itemsLine: (items ?? []).map((i) => `${i.product_name} (${i.variant_name}) x${i.quantity}`).join(", ") || "-",
    lines: (items ?? []).map((i) => ({ label: `${i.product_name} (${i.variant_name}) × ${i.quantity}`, value: formatKES(Number(i.unit_price) * i.quantity) })),
    totals: [
      { label: "Subtotal", value: formatKES(Number(order.subtotal)) },
      { label: isPickup ? "Pickup" : "Delivery", value: Number(order.shipping_total) > 0 ? formatKES(Number(order.shipping_total)) : "Free" },
      { label: "Total", value: formatKES(Number(order.total)) },
    ],
  };
}

async function record(admin: Admin, orderId: string, channel: "EMAIL" | "WHATSAPP", recipient: string, subject: string, eventType: string, result: SendResult): Promise<void> {
  if (result.skipped) return;
  if (!result.ok) console.error(`[notify] ${channel} ${eventType} to ${recipient} failed: ${result.error}`);
  await admin.from("email_messages").insert({
    order_id: orderId,
    recipient,
    subject,
    event_type: eventType,
    channel,
    provider_message_id: result.providerId ?? null,
    status: result.ok ? "SENT" : "FAILED",
    error: result.ok ? null : (result.error ?? null),
  });
}

/** Sends one message on both channels to each recipient, and records the outcome. */
async function deliver<Context>(
  admin: Admin,
  order: LoadedOrder,
  eventType: string,
  definition: MessageDefinition<Context>,
  context: Context,
  to: { emails: string[]; phones: string[] },
  button: { label: string; url: string }
): Promise<void> {
  const params = definition.params(context);
  const subject = definition.subject(context);

  const jobs: Promise<void>[] = [];
  if (to.emails.length) {
    jobs.push(
      sendEmail(to.emails, { subject, message: renderMessage(definition.text, params), lines: order.lines, totals: order.totals, button }).then((result) =>
        record(admin, order.id, "EMAIL", to.emails.join(", "), subject, eventType, result)
      )
    );
  }
  for (const phone of to.phones) {
    jobs.push(sendWhatsappTemplate(phone, definition.template, params).then((result) => record(admin, order.id, "WHATSAPP", phone, subject, eventType, result)));
  }
  await Promise.allSettled(jobs);
}

async function notifyCustomer(orderId: string, status: OrderStatus): Promise<void> {
  const admin = createAdminClient();
  const order = await loadOrder(admin, orderId);
  if (!order) return;
  const context: CustomerMessageContext = {
    firstName: order.customerName.split(/\s+/)[0],
    orderNumber: order.orderNumber,
    total: formatKES(order.total),
    destination: order.destination,
    orderUrl: order.orderUrl,
  };
  await deliver(admin, order, `order.${status}`, CUSTOMER_MESSAGES[status], context, { emails: order.email ? [order.email] : [], phones: order.phone ? [order.phone] : [] }, { label: "View your order", url: order.orderUrl });
}

async function notifyAdmins(orderId: string): Promise<void> {
  const admin = createAdminClient();
  const order = await loadOrder(admin, orderId);
  if (!order) return;
  const context: AdminMessageContext = {
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    customerPhone: order.phone ?? "not given",
    total: formatKES(order.total),
    receipt: order.receipt ?? "not yet available",
    items: order.itemsLine,
    fulfilment: order.fulfilmentLine,
    adminUrl: order.adminUrl,
  };
  await deliver(admin, order, "admin.paid_order", ADMIN_PAID_ORDER, context, { emails: list(process.env.ADMIN_EMAIL), phones: list(process.env.ADMIN_WHATSAPP_NUMBERS) }, { label: "Open in admin", url: order.adminUrl });
}

function inBackground(label: string, job: () => Promise<void>): void {
  after(async () => {
    try {
      await job();
    } catch (error) {
      console.error(`[notify] ${label} failed`, error);
    }
  });
}

/** The customer's message for the status an order has just moved to. */
export function queueOrderStatusNotification(orderId: string, status: OrderStatus): void {
  inBackground(`order.${status}`, () => notifyCustomer(orderId, status));
}

/** A payment has just confirmed an order: thank the customer and alert the admins. */
export function queueOrderPaidNotifications(orderId: string): void {
  inBackground("order.PAYMENT_CONFIRMED", () => notifyCustomer(orderId, "PAYMENT_CONFIRMED"));
  inBackground("admin.paid_order", () => notifyAdmins(orderId));
}
