// Boundary for Safaricom Daraja (M-Pesa STK Push) integration.
// Intentionally unimplemented: there is no backend or Daraja credentials configured yet.
// When a backend exists, replace this with a call to a server route that talks to the
// Daraja API and returns a real status — never resolve "success" from the client alone.

export interface MpesaChargeRequest {
  phone: string;
  amount: number;
  orderRef: string;
}

export interface MpesaChargeResult {
  status: "unavailable" | "success" | "error";
  message: string;
}

export async function initiateMpesaPayment(_request: MpesaChargeRequest): Promise<MpesaChargeResult> {
  void _request;
  return {
    status: "unavailable",
    message:
      "Online M-Pesa payment isn't connected yet. Send us your order on WhatsApp and we'll confirm payment directly.",
  };
}
