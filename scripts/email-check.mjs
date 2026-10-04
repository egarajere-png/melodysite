// Checks the order-email setup and sends two samples, using the same code, wording and
// layout the site sends for a real order:
//   1. the customer's "payment received" email  → to the address you give
//   2. the shop's "new paid order" alert        → to ADMIN_EMAIL
//
//   npm run check:email -- you@example.com
//
// Needs SMTP_USER and SMTP_PASS in .env.local (a Gmail address and its app password).

import { ADMIN_PAID_ORDER, CUSTOMER_MESSAGES, renderMessage } from "../lib/notifications/messages.ts";
import { checkSmtpLogin, sendEmail } from "../lib/notifications/email.ts";

const env = process.env;
const to = process.argv[2];

const problem = await checkSmtpLogin();
if (problem) {
  console.error(`✗ Couldn't sign in to the mailbox${env.SMTP_USER ? ` ${env.SMTP_USER}` : ""}: ${problem}`);
  console.error("  SMTP_USER is the Gmail address and SMTP_PASS its app password (16 letters, from myaccount.google.com/apppasswords —");
  console.error("  not the normal password). Both go in .env.local. 2-Step Verification must be on for that Google account.");
  process.exit(1);
}
console.log(`✓ Signed in to ${env.SMTP_HOST || "smtp.gmail.com"} as ${env.SMTP_USER}.`);

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
    { label: "Delivery", value: "Ksh 300" },
    { label: "Total", value: "Ksh 4,500" },
  ],
};
const customer = { firstName: "Wanjiru", orderNumber: "AE-SAMPLE", total: "Ksh 4,500", destination: "Madaraka Primary School, Langata", orderUrl: "https://example.com/orders/AE-SAMPLE" };
const admin = {
  orderNumber: "AE-SAMPLE",
  customerName: "Wanjiru Kamau",
  customerPhone: "0712 345 678",
  total: "Ksh 4,500",
  receipt: "SJ12ABCDEF",
  items: "Maasai Collar (Gold) x1",
  fulfilment: "Delivery to Madaraka Primary School, Langata",
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
