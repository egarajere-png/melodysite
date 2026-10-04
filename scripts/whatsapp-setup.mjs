// Sets up and checks WhatsApp order messages (Meta WhatsApp Cloud API).
//
//   npm run setup:whatsapp                  → check the keys, create any missing templates, show their approval status
//   npm run setup:whatsapp -- 0712345678       → also send the "order completed" sample to that number (once approved)
//
// Needs WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_BUSINESS_ACCOUNT_ID.
// The template wording is read from lib/notifications/messages.ts, so what Meta approves
// is exactly what the site sends.

import { ADMIN_PAID_ORDER, CUSTOMER_MESSAGES } from "../lib/notifications/messages.ts";

const env = process.env;
const GRAPH = "https://graph.facebook.com/v22.0";
const language = env.WHATSAPP_TEMPLATE_LANGUAGE || "en";

const missing = ["WHATSAPP_ACCESS_TOKEN", "WHATSAPP_PHONE_NUMBER_ID", "WHATSAPP_BUSINESS_ACCOUNT_ID"].filter((name) => !env[name]);
if (missing.length) {
  console.error(`Missing in .env.local: ${missing.join(", ")}`);
  process.exit(1);
}

async function graph(path, init) {
  const response = await fetch(`${GRAPH}/${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`, "Content-Type": "application/json" },
  });
  const body = await response.json().catch(() => ({}));
  return { ok: response.ok, body, error: body?.error?.error_user_msg ?? body?.error?.message };
}

// Sample values Meta asks for when reviewing a template.
const customerSample = {
  firstName: "Wanjiru",
  orderNumber: "AE-9016FBAB",
  total: "Ksh 4,500",
  destination: "Madaraka Primary School, Langata",
  orderUrl: "https://aurumentonet.co.ke/orders/AE-9016FBAB",
};
const adminSample = {
  orderNumber: "AE-9016FBAB",
  customerName: "Wanjiru Kamau",
  customerPhone: "0712 345 678",
  total: "Ksh 4,500",
  receipt: "SJ12ABCDEF",
  items: "Maasai Collar (Gold) x1, Beaded Cuff (Red) x2",
  fulfilment: "Delivery to Madaraka Primary School, Langata",
  adminUrl: "https://aurumentonet.co.ke/admin/orders/AE-9016FBAB",
};
const wanted = [
  ...Object.values(CUSTOMER_MESSAGES).map((definition) => ({ definition, samples: definition.params(customerSample) })),
  { definition: ADMIN_PAID_ORDER, samples: ADMIN_PAID_ORDER.params(adminSample) },
];

// 1. The sending number.
const phone = await graph(`${env.WHATSAPP_PHONE_NUMBER_ID}?fields=display_phone_number,verified_name`);
if (!phone.ok) {
  console.error(`✗ The access token or phone number ID was rejected: ${phone.error}`);
  process.exit(1);
}
console.log(`✓ Sending number: ${phone.body.display_phone_number} (${phone.body.verified_name})`);

// 2. Templates: create whatever is missing.
const existing = await graph(`${env.WHATSAPP_BUSINESS_ACCOUNT_ID}/message_templates?fields=name,status,language&limit=200`);
if (!existing.ok) {
  console.error(`✗ Couldn't read templates — check WHATSAPP_BUSINESS_ACCOUNT_ID and that the token has the whatsapp_business_management permission: ${existing.error}`);
  process.exit(1);
}
const statusOf = new Map((existing.body.data ?? []).filter((t) => t.language === language).map((t) => [t.name, t.status]));

for (const { definition, samples } of wanted) {
  if (statusOf.has(definition.template)) continue;
  const created = await graph(`${env.WHATSAPP_BUSINESS_ACCOUNT_ID}/message_templates`, {
    method: "POST",
    body: JSON.stringify({
      name: definition.template,
      language,
      category: "UTILITY",
      components: [{ type: "BODY", text: definition.text, example: { body_text: [samples] } }],
    }),
  });
  statusOf.set(definition.template, created.ok ? (created.body.status ?? "PENDING") : `NOT CREATED — ${created.error}`);
}

console.log("\nTemplates:");
for (const { definition } of wanted) console.log(`  ${statusOf.get(definition.template) === "APPROVED" ? "✓" : "…"} ${definition.template.padEnd(28)} ${statusOf.get(definition.template)}`);
const approved = wanted.filter(({ definition }) => statusOf.get(definition.template) === "APPROVED").length;
console.log(`\n${approved} of ${wanted.length} approved.${approved < wanted.length ? " Meta reviews new templates (usually minutes, sometimes a day) — run this again to see progress." : " WhatsApp messages are ready."}`);

// 3. Optional test send.
const to = process.argv[2]?.replace(/[\s\-()+]/g, "").replace(/^0/, "254");
if (to) {
  const definition = CUSTOMER_MESSAGES.COMPLETED;
  const sent = await graph(`${env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
    method: "POST",
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "template",
      template: { name: definition.template, language: { code: language }, components: [{ type: "body", parameters: definition.params(customerSample).map((text) => ({ type: "text", text })) }] },
    }),
  });
  console.log(sent.ok ? `✓ Test message sent to ${to}.` : `✗ Test message failed: ${sent.error}`);
}
