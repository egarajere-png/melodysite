import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { describeStkFailure, isMpesaConfigured, mpesaChargeAmount, parseStkCallback, stkPush, stkQuery, type StkOutcome } from "@/lib/payments/mpesa";
import { toMpesaMsisdn } from "@/lib/payments/phone";
import { queueOrderPaidNotifications } from "@/lib/notifications/order-notifications";
import type { Json, OrderStatus, PaymentStatus } from "@/lib/supabase/database.types";

/**
 * How an M-Pesa prompt becomes a paid order.
 *
 * An order is only ever marked paid by confirm_mpesa_payment() (see the migration),
 * and only on Safaricom's word — the callback they post to us, or their answer to a
 * status query. Nothing the browser sends can mark an order paid. There's no client
 * policy on payments, so every write here uses the service-role client.
 */

type Admin = ReturnType<typeof createAdminClient>;

export interface MpesaPaymentView {
  /**
   * unpaid: nothing sent yet · pending: prompt is on the customer's phone ·
   * paid · failed: last prompt didn't go through, can retry ·
   * unavailable: can't be paid online right now (not configured, or the order is closed).
   */
  state: "unpaid" | "pending" | "paid" | "failed" | "unavailable";
  message: string | null;
  receipt: string | null;
}

export interface PayableOrder {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  total: number;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PAYABLE_ORDER_SELECT = "id, order_number, status, total";
const PAYMENT_SELECT = "id, status, amount, provider_reference, receipt_number, failure_reason, created_at, updated_at";

/** Give the callback a head start before asking Daraja ourselves, then ask at most this often. */
const QUERY_AFTER_MS = 20_000;
const QUERY_EVERY_MS = 10_000;
/** A prompt expires on the phone after about a minute; well past that, stop waiting. */
const GIVE_UP_AFTER_MS = 180_000;
const MAX_ATTEMPTS_PER_ORDER = 8;

const UNCONFIRMED_MESSAGE =
  "We couldn't confirm this payment with M-Pesa. If money left your account, please don't pay again — contact us with your order number and we'll sort it out.";
const UNAVAILABLE_MESSAGE = "Online M-Pesa payment isn't available right now. Message us on WhatsApp and we'll complete your payment directly.";

interface PaymentRow {
  id: string;
  status: PaymentStatus;
  amount: number;
  provider_reference: string | null;
  receipt_number: string | null;
  failure_reason: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * The order someone is allowed to pay for: their own (RLS, signed in) or one they hold
 * the access token for (the link in a guest's order page) — same rule as viewing it.
 */
export async function findPayableOrder(orderNumber: string, accessToken?: string): Promise<PayableOrder | null> {
  const number = orderNumber.trim().toUpperCase();
  const rls = await createClient();
  let { data: order } = await rls.from("orders").select(PAYABLE_ORDER_SELECT).eq("order_number", number).maybeSingle();
  if (!order && accessToken && UUID.test(accessToken)) {
    ({ data: order } = await createAdminClient().from("orders").select(PAYABLE_ORDER_SELECT).eq("order_number", number).eq("access_token", accessToken).maybeSingle());
  }
  return order ? { id: order.id, orderNumber: order.order_number, status: order.status, total: Number(order.total) } : null;
}

async function latestPayment(admin: Admin, orderId: string): Promise<PaymentRow | null> {
  const { data, error } = await admin
    .from("payments")
    .select(PAYMENT_SELECT)
    .eq("order_id", orderId)
    .eq("provider", "MPESA")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

function isOpen(status: PaymentStatus) {
  return status === "PENDING" || status === "PROCESSING";
}

async function markSucceeded(admin: Admin, orderId: string, paymentId: string, receipt: string | null, payload: Json): Promise<void> {
  const { data: outcome, error } = await admin.rpc("confirm_mpesa_payment", { p_payment_id: paymentId, p_payload: payload, ...(receipt ? { p_receipt: receipt } : {}) });
  if (error) throw error;
  // "confirmed" is returned exactly once per order, so these can't be sent twice.
  if (outcome === "confirmed") queueOrderPaidNotifications(orderId);
}

/** Only ever closes a prompt that is still open, so it can't overwrite a success. */
async function markFailed(admin: Admin, paymentId: string, status: "FAILED" | "CANCELLED", reason: string): Promise<void> {
  const { error } = await admin
    .from("payments")
    .update({ status, failure_reason: reason, updated_at: new Date().toISOString() })
    .eq("id", paymentId)
    .in("status", ["PENDING", "PROCESSING"]);
  if (error) throw error;
}

/**
 * Brings an open payment up to date by asking Daraja directly. This is what makes
 * payment work even if the callback never arrives (it can't reach localhost, and
 * Safaricom doesn't retry a missed one).
 */
async function reconcile(admin: Admin, orderId: string, payment: PaymentRow): Promise<void> {
  if (!isOpen(payment.status)) return;
  const age = Date.now() - Date.parse(payment.created_at);

  // The prompt was never sent (the request died between creating the row and Daraja answering).
  if (!payment.provider_reference) {
    if (age > QUERY_AFTER_MS * 2) await markFailed(admin, payment.id, "FAILED", "We couldn't reach M-Pesa. Please try again.");
    return;
  }

  if (age < QUERY_AFTER_MS || Date.now() - Date.parse(payment.updated_at) < QUERY_EVERY_MS) return;
  // Stamp before asking, so overlapping status checks don't all query Daraja at once.
  await admin.from("payments").update({ updated_at: new Date().toISOString() }).eq("id", payment.id).in("status", ["PENDING", "PROCESSING"]);

  let outcome: StkOutcome;
  try {
    outcome = await stkQuery(payment.provider_reference);
  } catch (error) {
    console.error("[mpesa] status query failed", error);
    outcome = { state: "pending" };
  }

  if (outcome.state === "success") {
    await markSucceeded(admin, orderId, payment.id, null, { source: "stk_query", checkout_request_id: payment.provider_reference });
  } else if (outcome.state === "failed") {
    await markFailed(admin, payment.id, outcome.resultCode === "1032" ? "CANCELLED" : "FAILED", describeStkFailure(outcome.resultCode));
  } else if (age > GIVE_UP_AFTER_MS) {
    await markFailed(admin, payment.id, "FAILED", UNCONFIRMED_MESSAGE);
  }
}

function toView(orderStatus: OrderStatus, payment: PaymentRow | null): MpesaPaymentView {
  const receipt = payment?.status === "SUCCEEDED" ? payment.receipt_number : null;
  if (orderStatus === "CANCELLED" || orderStatus === "REFUNDED") return { state: "unavailable", message: "This order is no longer awaiting payment.", receipt: null };
  if (orderStatus !== "PAYMENT_PENDING") return { state: "paid", message: null, receipt };
  if (!isMpesaConfigured()) return { state: "unavailable", message: UNAVAILABLE_MESSAGE, receipt: null };
  if (!payment) return { state: "unpaid", message: null, receipt: null };
  if (isOpen(payment.status)) return { state: "pending", message: null, receipt: null };
  return { state: "failed", message: payment.failure_reason ?? "The payment didn't go through.", receipt: null };
}

async function currentView(admin: Admin, orderId: string): Promise<MpesaPaymentView> {
  let payment = await latestPayment(admin, orderId);
  if (payment && isOpen(payment.status) && isMpesaConfigured()) {
    await reconcile(admin, orderId, payment);
    payment = await latestPayment(admin, orderId);
  }
  // Read the order after reconciling — reconciling is what may have just confirmed it.
  const { data: order, error } = await admin.from("orders").select("status").eq("id", orderId).single();
  if (error) throw error;
  return toView(order.status, payment);
}

/** Where an order's payment stands right now. The caller must already have checked access with findPayableOrder(). */
export async function getMpesaPaymentView(orderId: string): Promise<MpesaPaymentView> {
  return currentView(createAdminClient(), orderId);
}

/**
 * Sends the M-Pesa prompt for an order. The amount is always the order's own total
 * from the database. If a prompt is already waiting on the phone, no second one is sent.
 */
export async function startMpesaPayment(order: PayableOrder, rawPhone: string): Promise<MpesaPaymentView> {
  const admin = createAdminClient();
  const view = await currentView(admin, order.id);
  if (view.state === "pending" || view.state === "paid" || view.state === "unavailable") return view;

  const phone = toMpesaMsisdn(rawPhone);
  if (!phone) return { state: "failed", message: "Enter a valid Safaricom M-Pesa number, e.g. 0712 345 678.", receipt: null };

  const { count } = await admin.from("payments").select("id", { count: "exact", head: true }).eq("order_id", order.id);
  if ((count ?? 0) >= MAX_ATTEMPTS_PER_ORDER) {
    return { state: "unavailable", message: "This order has had too many payment attempts. Message us on WhatsApp and we'll help you complete it.", receipt: null };
  }

  const { data: payment, error: insertErr } = await admin
    .from("payments")
    .insert({ order_id: order.id, provider: "MPESA", status: "PENDING", amount: mpesaChargeAmount(order.total), phone })
    .select("id, amount")
    .single();
  if (insertErr) {
    // 23505: the one-open-payment-per-order index — another request got there first.
    if (insertErr.code === "23505") return { state: "pending", message: null, receipt: null };
    throw insertErr;
  }

  try {
    const { checkoutRequestId } = await stkPush({ phone, amount: Number(payment.amount), reference: order.orderNumber });
    const { error } = await admin
      .from("payments")
      .update({ provider_reference: checkoutRequestId, status: "PROCESSING", updated_at: new Date().toISOString() })
      .eq("id", payment.id);
    if (error) throw error;
    return { state: "pending", message: null, receipt: null };
  } catch (error) {
    console.error("[mpesa] could not send prompt", error);
    const reason = "We couldn't send the M-Pesa request. Check the number and try again.";
    await markFailed(admin, payment.id, "FAILED", reason);
    return { state: "failed", message: reason, receipt: null };
  }
}

/**
 * Applies the result Safaricom posts to the callback URL. Matched on the request id
 * Daraja gave us when the prompt was sent, which never leaves the server.
 */
export async function handleStkCallback(raw: unknown): Promise<void> {
  const callback = parseStkCallback(raw);
  if (!callback) return;

  const admin = createAdminClient();
  const { data: payment, error } = await admin
    .from("payments")
    .select(`order_id, ${PAYMENT_SELECT}`)
    .eq("provider", "MPESA")
    .eq("provider_reference", callback.checkoutRequestId)
    .maybeSingle();
  if (error) throw error;
  if (!payment) return;

  // Raw record of what Safaricom sent; event_key is unique, so a repeat delivery is a no-op.
  await admin
    .from("payment_events")
    .upsert({ payment_id: payment.id, provider: "MPESA", event_key: `stk:${callback.checkoutRequestId}`, payload: raw as Json }, { onConflict: "event_key", ignoreDuplicates: true });

  if (callback.resultCode !== "0") {
    await markFailed(admin, payment.id, callback.resultCode === "1032" ? "CANCELLED" : "FAILED", describeStkFailure(callback.resultCode));
    return;
  }
  if (callback.amount !== null && callback.amount < Number(payment.amount)) {
    console.error(`[mpesa] callback amount ${callback.amount} is below the ${payment.amount} requested for payment ${payment.id}; not confirming.`);
    return;
  }
  await markSucceeded(admin, payment.order_id, payment.id, callback.receipt, raw as Json);
}
