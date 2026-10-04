"use server";

import { findPayableOrder, getMpesaPaymentView, startMpesaPayment, type MpesaPaymentView } from "@/lib/supabase/payments";

const NOT_FOUND: MpesaPaymentView = { state: "unavailable", message: "We couldn't find that order.", receipt: null };
const TRY_AGAIN: MpesaPaymentView = { state: "failed", message: "Something went wrong on our side. Please try again.", receipt: null };

/** Sends the M-Pesa prompt for an order the caller owns (or holds the access token for). */
export async function startMpesaPaymentAction(orderNumber: string, accessToken: string | undefined, phone: string): Promise<MpesaPaymentView> {
  try {
    const order = await findPayableOrder(orderNumber, accessToken);
    if (!order) return NOT_FOUND;
    return await startMpesaPayment(order, phone);
  } catch (error) {
    console.error("[mpesa] start payment failed", error);
    return TRY_AGAIN;
  }
}

/** Polled by the payment panel while the prompt is on the customer's phone. Null means "couldn't check — keep waiting". */
export async function getMpesaPaymentStatusAction(orderNumber: string, accessToken: string | undefined): Promise<MpesaPaymentView | null> {
  try {
    const order = await findPayableOrder(orderNumber, accessToken);
    if (!order) return NOT_FOUND;
    return await getMpesaPaymentView(order.id);
  } catch (error) {
    console.error("[mpesa] status check failed", error);
    return null;
  }
}
