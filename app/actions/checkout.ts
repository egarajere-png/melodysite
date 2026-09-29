"use server";

import { createClient } from "@/lib/supabase/server";
import { CheckoutError, createOrder, type CreateOrderInput, type CreatedOrder } from "@/lib/supabase/orders";

export type CreateOrderActionResult = { ok: true; order: CreatedOrder } | { ok: false; error: string; signInRequired?: boolean };

export async function createOrderAction(input: CreateOrderInput): Promise<CreateOrderActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sign in to place your order.", signInRequired: true };

  try {
    const order = await createOrder(user.id, input);
    return { ok: true, order };
  } catch (error) {
    // Only our own validation messages are shown verbatim; database/internal errors
    // get a generic message rather than leaking details.
    return { ok: false, error: error instanceof CheckoutError ? error.message : "We couldn't place your order. Please try again." };
  }
}
