"use server";

import { findGuestOrderToken } from "@/lib/supabase/orders-customer";

export type LookupOrderResult = { ok: true; href: string } | { ok: false; error: string };

export async function lookupOrderAction(orderNumber: string, email: string): Promise<LookupOrderResult> {
  const number = orderNumber.trim().toUpperCase();
  if (!/^AE-[A-Z0-9]{6,12}$/.test(number) || !email.trim()) return { ok: false, error: "Enter your order number (e.g. AE-9016FBAB) and the email you used at checkout." };
  try {
    const token = await findGuestOrderToken(number, email);
    // Same message either way, so this can't be used to discover which orders exist.
    if (!token) return { ok: false, error: "We couldn't find an order with that number and email." };
    return { ok: true, href: `/orders/${number}?t=${token}` };
  } catch {
    return { ok: false, error: "We couldn't look that up right now. Please try again." };
  }
}
