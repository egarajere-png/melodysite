"use server";

import { createClient } from "@/lib/supabase/server";
import { createOrder, type CreateOrderInput, type CreatedOrder } from "@/lib/supabase/orders";

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
    return { ok: false, error: error instanceof Error ? error.message : "We couldn't place your order. Please try again." };
  }
}
