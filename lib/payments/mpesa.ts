// Safaricom Daraja (M-Pesa STK Push) client. Server-only: it reads the Daraja
// credentials from the environment and must never be imported by a client component.
// Nothing here touches the database — see lib/supabase/payments.ts for how a Daraja
// result becomes a paid order.

export type MpesaEnvironment = "sandbox" | "production";

interface MpesaConfig {
  environment: MpesaEnvironment;
  baseUrl: string;
  consumerKey: string;
  consumerSecret: string;
  /** Signs the request. For a till this is the store / head-office number, not the till itself. */
  shortcode: string;
  passkey: string;
  /** Buy Goods till the money lands in. Empty for a paybill, where it lands in the shortcode. */
  tillNumber: string;
  callbackUrl: string;
}

/** Thrown for anything Daraja-related; `message` is for logs, never shown to customers. */
export class MpesaError extends Error {}

export function mpesaEnvironment(): MpesaEnvironment {
  return process.env.MPESA_ENVIRONMENT === "production" ? "production" : "sandbox";
}

/** The secret path segment of the callback URL; Daraja callbacks aren't signed, so this is what keeps strangers out. */
export function mpesaCallbackSecret(): string {
  return process.env.MPESA_CALLBACK_SECRET ?? "";
}

function readConfig(): MpesaConfig | null {
  const environment = mpesaEnvironment();
  const consumerKey = process.env.MPESA_CONSUMER_KEY ?? "";
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET ?? "";
  const shortcode = process.env.MPESA_SHORTCODE ?? "";
  const passkey = process.env.MPESA_PASSKEY ?? "";
  const callbackBase = (process.env.MPESA_CALLBACK_URL ?? "").replace(/\/+$/, "");
  const secret = mpesaCallbackSecret();
  if (!consumerKey || !consumerSecret || !shortcode || !passkey || !callbackBase || !secret) return null;
  return {
    environment,
    baseUrl: environment === "production" ? "https://api.safaricom.co.ke" : "https://sandbox.safaricom.co.ke",
    consumerKey,
    consumerSecret,
    shortcode,
    passkey,
    tillNumber: process.env.MPESA_TILL_NUMBER ?? "",
    callbackUrl: `${callbackBase}/${secret}`,
  };
}

export function isMpesaConfigured(): boolean {
  return readConfig() !== null;
}

function requireConfig(): MpesaConfig {
  const config = readConfig();
  if (!config) throw new MpesaError("M-Pesa is not configured.");
  return config;
}

/**
 * What to actually request for an order total. Daraja only takes whole shillings, so
 * the total is rounded up. In the sandbox, MPESA_SANDBOX_AMOUNT (e.g. 1) replaces it
 * so a test doesn't move the full order value; it is ignored in production.
 */
export function mpesaChargeAmount(orderTotal: number): number {
  const override = Number(process.env.MPESA_SANDBOX_AMOUNT);
  if (mpesaEnvironment() === "sandbox" && Number.isInteger(override) && override > 0) return override;
  return Math.ceil(orderTotal);
}

let cachedToken: { value: string; expiresAt: number; key: string } | null = null;

async function getAccessToken(config: MpesaConfig): Promise<string> {
  if (cachedToken && cachedToken.key === config.consumerKey && cachedToken.expiresAt > Date.now()) return cachedToken.value;

  const basic = Buffer.from(`${config.consumerKey}:${config.consumerSecret}`).toString("base64");
  const response = await fetch(`${config.baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${basic}` },
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  const body = (await response.json().catch(() => null)) as { access_token?: string; expires_in?: string | number } | null;
  if (!response.ok || !body?.access_token) throw new MpesaError(`Daraja token request failed (${response.status}).`);

  // Refresh a minute early so a token never expires mid-request.
  cachedToken = { value: body.access_token, expiresAt: Date.now() + (Number(body.expires_in ?? 3599) - 60) * 1000, key: config.consumerKey };
  return cachedToken.value;
}

/** YYYYMMDDHHmmss in East Africa Time, as Daraja expects. */
function timestamp(): string {
  return new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString().replace(/\D/g, "").slice(0, 14);
}

function signature(config: MpesaConfig) {
  const Timestamp = timestamp();
  return { BusinessShortCode: config.shortcode, Password: Buffer.from(`${config.shortcode}${config.passkey}${Timestamp}`).toString("base64"), Timestamp };
}

interface DarajaResponse {
  status: number;
  body: Record<string, unknown>;
}

async function post(config: MpesaConfig, path: string, payload: Record<string, unknown>): Promise<DarajaResponse> {
  const token = await getAccessToken(config);
  const response = await fetch(`${config.baseUrl}${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
    signal: AbortSignal.timeout(25_000),
  });
  const body = ((await response.json().catch(() => null)) ?? {}) as Record<string, unknown>;
  return { status: response.status, body };
}

export interface StkPushRequest {
  /** 2547XXXXXXXX — see toMpesaMsisdn(). */
  phone: string;
  /** Whole shillings — see mpesaChargeAmount(). */
  amount: number;
  /** Shown to the customer on the prompt; Daraja allows 12 characters. */
  reference: string;
}

/** Sends the "enter your M-Pesa PIN" prompt. Resolves with Daraja's id for the request. */
export async function stkPush(request: StkPushRequest): Promise<{ checkoutRequestId: string }> {
  const config = requireConfig();
  const { status, body } = await post(config, "/mpesa/stkpush/v1/processrequest", {
    ...signature(config),
    TransactionType: config.tillNumber ? "CustomerBuyGoodsOnline" : "CustomerPayBillOnline",
    Amount: request.amount,
    PartyA: request.phone,
    PartyB: config.tillNumber || config.shortcode,
    PhoneNumber: request.phone,
    CallBackURL: config.callbackUrl,
    AccountReference: request.reference.slice(0, 12),
    TransactionDesc: "Aurum order",
  });
  const checkoutRequestId = body.CheckoutRequestID;
  if (body.ResponseCode !== "0" || typeof checkoutRequestId !== "string") {
    throw new MpesaError(`STK push rejected (${status}, ${String(body.errorCode ?? body.ResponseCode ?? "no code")}): ${String(body.errorMessage ?? body.ResponseDescription ?? "unknown error")}`);
  }
  return { checkoutRequestId };
}

export type StkOutcome = { state: "pending" } | { state: "success" } | { state: "failed"; resultCode: string; resultDesc: string };

/**
 * Asks Daraja what became of a prompt. Used when the callback hasn't arrived (or can't,
 * e.g. on localhost). A lookup that errors is reported as "pending" — never as a
 * failure — so a flaky status call can't tell a customer who has paid to pay again.
 */
export async function stkQuery(checkoutRequestId: string): Promise<StkOutcome> {
  const config = requireConfig();
  const { body } = await post(config, "/mpesa/stkpushquery/v1/query", { ...signature(config), CheckoutRequestID: checkoutRequestId });
  if (body.ResultCode === undefined || body.ResultCode === null) return { state: "pending" };
  const resultCode = String(body.ResultCode);
  // 4999: Daraja's own "still under processing" result.
  if (resultCode === "4999") return { state: "pending" };
  if (resultCode === "0") return { state: "success" };
  return { state: "failed", resultCode, resultDesc: String(body.ResultDesc ?? "") };
}

/** Plain-language reason for a failed prompt, safe to show the customer. */
export function describeStkFailure(resultCode: string): string {
  switch (resultCode) {
    case "1032":
      return "The M-Pesa request was cancelled on your phone.";
    case "1037":
    case "1019":
      return "The M-Pesa request timed out before a PIN was entered.";
    case "1":
      return "Your M-Pesa balance isn't enough for this payment.";
    case "2001":
      return "The M-Pesa PIN entered was incorrect.";
    case "1001":
      return "Your phone has another M-Pesa request open. Wait a minute, then try again.";
    default:
      return "M-Pesa couldn't complete the payment.";
  }
}

export interface StkCallback {
  checkoutRequestId: string;
  resultCode: string;
  resultDesc: string;
  amount: number | null;
  receipt: string | null;
}

/** Reads the body Daraja posts to the callback URL; null if it isn't an STK callback. */
export function parseStkCallback(raw: unknown): StkCallback | null {
  const callback = (raw as { Body?: { stkCallback?: Record<string, unknown> } } | null)?.Body?.stkCallback;
  if (!callback || typeof callback.CheckoutRequestID !== "string" || callback.ResultCode === undefined) return null;

  const items = (callback.CallbackMetadata as { Item?: { Name?: string; Value?: unknown }[] } | undefined)?.Item ?? [];
  const value = (name: string) => items.find((item) => item.Name === name)?.Value;
  const amount = Number(value("Amount"));
  const receipt = value("MpesaReceiptNumber");

  return {
    checkoutRequestId: callback.CheckoutRequestID,
    resultCode: String(callback.ResultCode),
    resultDesc: String(callback.ResultDesc ?? ""),
    amount: Number.isFinite(amount) ? amount : null,
    receipt: typeof receipt === "string" && receipt ? receipt : null,
  };
}
