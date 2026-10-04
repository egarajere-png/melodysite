import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { mpesaCallbackSecret } from "@/lib/payments/mpesa";
import { handleStkCallback } from "@/lib/supabase/payments";

// Where Safaricom posts the result of an M-Pesa prompt. Daraja doesn't sign its
// callbacks, so the URL itself carries a secret (MPESA_CALLBACK_SECRET) as its last
// segment; anything without it gets a 404.

function isValidToken(token: string): boolean {
  const secret = mpesaCallbackSecret();
  if (!secret) return false;
  const given = Buffer.from(token);
  const expected = Buffer.from(secret);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!isValidToken(token)) return new NextResponse(null, { status: 404 });

  try {
    await handleStkCallback(await request.json().catch(() => null));
  } catch (error) {
    // Still acknowledged: Safaricom won't resend, and the status query reconciles the
    // payment the next time the customer's page checks on it.
    console.error("[mpesa] callback handling failed", error);
  }
  return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
}
