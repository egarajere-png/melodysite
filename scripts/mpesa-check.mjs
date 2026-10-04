// Checks the M-Pesa (Daraja) credentials in .env.local without going through the shop.
//
//   npm run check:mpesa               → credentials only
//   npm run check:mpesa -- 0712345678    → also sends a KES 1 prompt to that phone
//
// The prompt is a real M-Pesa request for KES 1 (the sandbox reverses it; production does not).

const env = process.env;
const production = env.MPESA_ENVIRONMENT === "production";
const baseUrl = production ? "https://api.safaricom.co.ke" : "https://sandbox.safaricom.co.ke";

const required = ["MPESA_CONSUMER_KEY", "MPESA_CONSUMER_SECRET", "MPESA_SHORTCODE", "MPESA_PASSKEY", "MPESA_CALLBACK_URL", "MPESA_CALLBACK_SECRET"];
const missing = required.filter((name) => !env[name]);
if (missing.length) {
  console.error(`Missing in .env.local: ${missing.join(", ")}`);
  process.exit(1);
}
if (!/^https:\/\//.test(env.MPESA_CALLBACK_URL)) {
  console.error("MPESA_CALLBACK_URL must be a public https:// address (Safaricom rejects http and localhost).");
  process.exit(1);
}

console.log(`Environment: ${production ? "PRODUCTION" : "sandbox"} · shortcode ${env.MPESA_SHORTCODE}${env.MPESA_TILL_NUMBER ? ` · till ${env.MPESA_TILL_NUMBER}` : ""}`);

const basic = Buffer.from(`${env.MPESA_CONSUMER_KEY}:${env.MPESA_CONSUMER_SECRET}`).toString("base64");
const tokenResponse = await fetch(`${baseUrl}/oauth/v1/generate?grant_type=client_credentials`, { headers: { Authorization: `Basic ${basic}` } });
const tokenBody = await tokenResponse.json().catch(() => null);
if (!tokenResponse.ok || !tokenBody?.access_token) {
  console.error(`✗ Consumer key/secret were rejected (HTTP ${tokenResponse.status}). Check them, and that MPESA_ENVIRONMENT matches the app they belong to.`);
  process.exit(1);
}
console.log("✓ Consumer key and secret accepted.");

const rawPhone = process.argv[2];
if (!rawPhone) {
  console.log("Add a phone number to also send a KES 1 test prompt, e.g. npm run check:mpesa -- 0712345678");
  process.exit(0);
}
const match = /^(?:254|0)?([17]\d{8})$/.exec(rawPhone.replace(/[\s\-()+]/g, ""));
if (!match) {
  console.error("That doesn't look like a Kenyan mobile number (e.g. 0712345678).");
  process.exit(1);
}
const phone = `254${match[1]}`;

function signature() {
  const Timestamp = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString().replace(/\D/g, "").slice(0, 14);
  return { BusinessShortCode: env.MPESA_SHORTCODE, Password: Buffer.from(`${env.MPESA_SHORTCODE}${env.MPESA_PASSKEY}${Timestamp}`).toString("base64"), Timestamp };
}
async function post(path, payload) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${tokenBody.access_token}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return (await response.json().catch(() => null)) ?? {};
}

const push = await post("/mpesa/stkpush/v1/processrequest", {
  ...signature(),
  TransactionType: env.MPESA_TILL_NUMBER ? "CustomerBuyGoodsOnline" : "CustomerPayBillOnline",
  Amount: 1,
  PartyA: phone,
  PartyB: env.MPESA_TILL_NUMBER || env.MPESA_SHORTCODE,
  PhoneNumber: phone,
  CallBackURL: `${env.MPESA_CALLBACK_URL.replace(/\/+$/, "")}/${env.MPESA_CALLBACK_SECRET}`,
  AccountReference: "AE-TEST",
  TransactionDesc: "Aurum test",
});
if (push.ResponseCode !== "0") {
  console.error("✗ Safaricom rejected the prompt:", push.errorMessage ?? push.ResponseDescription ?? push);
  process.exit(1);
}
console.log(`✓ Prompt sent to ${phone}. Enter your M-Pesa PIN on the phone…`);

for (let attempt = 0; attempt < 12; attempt++) {
  await new Promise((resolve) => setTimeout(resolve, 10_000));
  const result = await post("/mpesa/stkpushquery/v1/query", { ...signature(), CheckoutRequestID: push.CheckoutRequestID });
  if (result.ResultCode === undefined || String(result.ResultCode) === "4999") {
    console.log("  …still waiting");
    continue;
  }
  if (String(result.ResultCode) === "0") {
    console.log("✓ Payment went through. M-Pesa is working.");
    process.exit(0);
  }
  console.error(`✗ Payment did not complete (code ${result.ResultCode}): ${result.ResultDesc}`);
  process.exit(1);
}
console.error("No answer from Safaricom after two minutes.");
process.exit(1);
