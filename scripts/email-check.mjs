// Checks the order-email setup and sends two samples, using the same code, wording and
// layout the site sends for a real order:
//   1. the customer's "payment received" email  → to the address you give
//   2. the shop's "new paid order" alert        → to ADMIN_EMAIL
//
//   npm run check:email -- you@example.com
//
// Needs RESEND_API_KEY and EMAIL_FROM in .env.local (EMAIL_FROM on a domain verified in Resend).

import { ADMIN_PAID_ORDER, CUSTOMER_MESSAGES, renderMessage } from "../lib/notifications/messages.ts";
import { checkEmailSetup, sendEmail } from "../lib/notifications/email.ts";

const env = process.env;
const to = process.argv[2];

const { problem, note } = await checkEmailSetup();
if (problem) {
  console.error(`✗ Email isn't ready: ${problem}`);
  console.error("  RESEND_API_KEY comes from resend.com → API Keys; EMAIL_FROM looks like: Aurum Entonet <info@aurumentonet.com>");
  process.exit(1);
}
console.log(`✓ Resend is set up. Sending as ${env.EMAIL_FROM}.`);
if (note) console.log(`  Note: ${note}`);

const admins = (env.ADMIN_EMAIL ?? "").split(",").map((a) => a.trim()).filter(Boolean);
if (!to) {
  console.log(`  New-order alerts go to: ${admins.join(", ") || "nobody yet — ADMIN_EMAIL is empty"}`);
  console.log("Add an address to send the samples, e.g. npm run check:email -- you@example.com");
  process.exit(0);
}

const order = {
  lines: [{ label: "Maasai Collar (Gold) × 1", value: "Ksh 4,200" }],
  totals: [
    { label: "Subtotal", value: "Ksh 4,200" },
    { label: "Pick Up Mtaani", value: "Ksh 180" },
    { label: "Total", value: "Ksh 4,380" },
  ],
};
const customer = { firstName: "Wanjiru", orderNumber: "AE-SAMPLE", total: "Ksh 4,380", destination: "Bleu Topaz, Kahawa Sukari, Baringo Road (Pick Up Mtaani code PM-123456)", orderUrl: "https://example.com/orders/AE-SAMPLE" };
const admin = {
  orderNumber: "AE-SAMPLE",
  customerName: "Wanjiru Kamau",
  customerPhone: "0712 345 678",
  total: "Ksh 4,380",
  receipt: "SJ12ABCDEF",
  items: "Maasai Collar (Gold) x1",
  fulfilment: "Pick Up Mtaani to Bleu Topaz, Kahawa Sukari, Baringo Road",
  adminUrl: "https://example.com/admin/orders/AE-SAMPLE",
};

async function sample(label, recipients, definition, context, button) {
  if (recipients.length === 0) return console.log(`- ${label}: skipped, nobody to send to (ADMIN_EMAIL is empty).`);
  const result = await sendEmail(recipients, { subject: `[Test] ${definition.subject(context)}`, message: renderMessage(definition.text, definition.params(context)), ...order, button });
  if (result.ok) console.log(`✓ ${label} sent to ${recipients.join(", ")}.`);
  else {
    console.error(`✗ ${label} was not sent: ${result.error}`);
    process.exitCode = 1;
  }
}

await sample("Customer email (payment received)", [to], CUSTOMER_MESSAGES.PAYMENT_CONFIRMED, customer, { label: "View your order", url: customer.orderUrl });
await sample("Shop alert (new paid order)", admins, ADMIN_PAID_ORDER, admin, { label: "Open in admin", url: admin.adminUrl });
console.log("Check the inboxes (and spam).");
