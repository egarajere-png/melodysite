import type { OrderStatus } from "@/lib/supabase/database.types";

// The wording of every order message, in one place. Each message is written once and
// used for both channels: email fills the {{n}} placeholders itself, while WhatsApp
// needs the same text approved by Meta as a template of the same name (see
// docs/whatsapp-templates.md — keep the two in step when changing wording here).
//
// WhatsApp rules the texts follow: placeholders are numbered from {{1}} in order, and a
// message may not start or end with one.

export interface MessageDefinition<Context> {
  /** WhatsApp template name. */
  template: string;
  subject: (c: Context) => string;
  text: string;
  /** Values for {{1}}, {{2}}, … in order. */
  params: (c: Context) => string[];
}

export interface CustomerMessageContext {
  firstName: string;
  orderNumber: string;
  /** Already formatted, e.g. "Ksh 4,500". */
  total: string;
  /** Where the order is going: "Madaraka Primary School, Langata" or the pickup point. */
  destination: string;
  orderUrl: string;
}

export interface AdminMessageContext {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  total: string;
  receipt: string;
  /** One line, e.g. "Maasai Collar (Gold) x1, Beaded Cuff (Red) x2". */
  items: string;
  /** "Delivery to …" or "Pickup at …". */
  fulfilment: string;
  adminUrl: string;
}

export const CUSTOMER_MESSAGES: Record<OrderStatus, MessageDefinition<CustomerMessageContext>> = {
  PAYMENT_PENDING: {
    template: "order_placed",
    subject: (c) => `We've received your order ${c.orderNumber}`,
    text: "Hello {{1}}, thank you for your order {{2}} at Aurum Entonet. Your total is {{3}}. Your order will be confirmed as soon as your M-Pesa payment is received. You can view or pay for it at {{4}} at any time.",
    params: (c) => [c.firstName, c.orderNumber, c.total, c.orderUrl],
  },
  PAYMENT_CONFIRMED: {
    template: "order_payment_received",
    subject: (c) => `Payment received for order ${c.orderNumber}`,
    text: "Hello {{1}}, we have received your payment of {{2}} for order {{3}}. Thank you! We are now getting your order ready and will keep you updated at every step. Follow it at {{4}} at any time.",
    params: (c) => [c.firstName, c.total, c.orderNumber, c.orderUrl],
  },
  PROCESSING: {
    template: "order_processing",
    subject: (c) => `Your order ${c.orderNumber} is being prepared`,
    text: "Hello {{1}}, your order {{2}} is now being prepared. Each piece is finished and checked by hand, and we will let you know as soon as it is ready. Follow it at {{3}} at any time.",
    params: (c) => [c.firstName, c.orderNumber, c.orderUrl],
  },
  READY_FOR_COLLECTION: {
    template: "order_ready_for_collection",
    subject: (c) => `Your order ${c.orderNumber} is ready for collection`,
    text: "Hello {{1}}, your order {{2}} is ready for collection at {{3}}. Please have your order number with you when you come. Pickup details are at {{4}} if you need them.",
    params: (c) => [c.firstName, c.orderNumber, c.destination, c.orderUrl],
  },
  DISPATCHED: {
    template: "order_dispatched",
    subject: (c) => `Your order ${c.orderNumber} has been dispatched`,
    text: "Hello {{1}}, your order {{2}} has been handed to our rider for delivery to {{3}}. We will message you again once it is on its way. Follow it at {{4}} at any time.",
    params: (c) => [c.firstName, c.orderNumber, c.destination, c.orderUrl],
  },
  IN_TRANSIT: {
    template: "order_in_transit",
    subject: (c) => `Your order ${c.orderNumber} is on its way`,
    text: "Hello {{1}}, your order {{2}} is currently in transit to {{3}}. Please keep your phone close, as our rider will call you on arrival. Follow it at {{4}} at any time.",
    params: (c) => [c.firstName, c.orderNumber, c.destination, c.orderUrl],
  },
  DELIVERED: {
    template: "order_delivered",
    subject: (c) => `Your order ${c.orderNumber} has been delivered`,
    text: "Hello {{1}}, your order {{2}} has been delivered to {{3}}. We hope you love it. If anything is not right, please reply to this message and we will make it right.",
    params: (c) => [c.firstName, c.orderNumber, c.destination],
  },
  COMPLETED: {
    template: "order_completed",
    subject: (c) => `Thank you for shopping with us — order ${c.orderNumber}`,
    text: "Hello {{1}}, your order {{2}} is now complete. Thank you for shopping with us at Aurum Entonet. It was a pleasure to serve you, and we hope to see you again soon.",
    params: (c) => [c.firstName, c.orderNumber],
  },
  CANCELLED: {
    template: "order_cancelled",
    subject: (c) => `Your order ${c.orderNumber} has been cancelled`,
    text: "Hello {{1}}, your order {{2}} has been cancelled. If you did not ask for this, or you have already paid, please reply to this message and we will help you right away.",
    params: (c) => [c.firstName, c.orderNumber],
  },
  REFUNDED: {
    template: "order_refunded",
    subject: (c) => `Your refund for order ${c.orderNumber}`,
    text: "Hello {{1}}, we have refunded {{2}} for your order {{3}}. The money should reflect in your account shortly. If you have any question, please reply to this message.",
    params: (c) => [c.firstName, c.total, c.orderNumber],
  },
};

/** Sent to the shop's admins the moment an order is paid. */
export const ADMIN_PAID_ORDER: MessageDefinition<AdminMessageContext> = {
  template: "admin_new_paid_order",
  subject: (c) => `New paid order ${c.orderNumber} — ${c.total}`,
  text: "Hello, a new order has been paid for at Aurum Entonet. Order {{1}} from {{2}}, phone {{3}}. Amount received: {{4}}, M-Pesa receipt {{5}}. Items: {{6}}. {{7}}. Open {{8}} to start processing it.",
  params: (c) => [c.orderNumber, c.customerName, c.customerPhone, c.total, c.receipt, c.items, c.fulfilment, c.adminUrl],
};

/** The finished sentence(s): `text` with each {{n}} replaced by its value. */
export function renderMessage(text: string, params: string[]): string {
  return text.replace(/\{\{(\d+)\}\}/g, (_, n: string) => params[Number(n) - 1] ?? "");
}
