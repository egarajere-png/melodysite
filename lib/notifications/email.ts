import nodemailer from "nodemailer";
import type { SendResult } from "@/lib/notifications/whatsapp";

// Email, sent through an ordinary mailbox over SMTP (a Gmail account with an app
// password by default). Server-only. Gmail allows about 500 emails a day and only
// sends as the account that signed in, so EMAIL_FROM must use that same address.

function smtpSettings() {
  const user = process.env.SMTP_USER ?? "";
  // Gmail shows app passwords in groups of four; the spaces aren't part of it.
  const pass = (process.env.SMTP_PASS ?? "").replace(/\s/g, "");
  if (!user || !pass) return null;
  const port = Number(process.env.SMTP_PORT) || 465;
  return { host: process.env.SMTP_HOST || "smtp.gmail.com", port, secure: port === 465, auth: { user, pass } };
}

export function isEmailConfigured(): boolean {
  return smtpSettings() !== null;
}

/** Logs in to the mail server without sending anything; resolves with the problem, or null if it worked. */
export async function checkSmtpLogin(): Promise<string | null> {
  const settings = smtpSettings();
  if (!settings) return "SMTP_USER and SMTP_PASS are not both set.";
  try {
    await nodemailer.createTransport(settings).verify();
    return null;
  } catch (error) {
    return error instanceof Error ? error.message : "SMTP login failed";
  }
}

interface OutgoingEmail {
  subject: string;
  text: string;
  html?: string;
  /** Defaults to SUPPORT_EMAIL. */
  replyTo?: string;
}

async function send(to: string[], email: OutgoingEmail): Promise<SendResult> {
  const recipients = to.map((address) => address.trim()).filter(Boolean);
  const settings = smtpSettings();
  if (!settings || recipients.length === 0) return { ok: false, skipped: true };

  try {
    const info = await nodemailer.createTransport(settings).sendMail({
      from: process.env.EMAIL_FROM || `Aurum Entonet <${settings.auth.user}>`,
      to: recipients,
      subject: email.subject,
      text: email.text,
      html: email.html,
      replyTo: email.replyTo || process.env.SUPPORT_EMAIL || undefined,
    });
    return { ok: true, providerId: info.messageId };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Email could not be sent" };
  }
}

/** A plain-text email, e.g. forwarding a contact-form message to the shop. */
export function sendTextEmail(to: string[], email: { subject: string; text: string; replyTo?: string }): Promise<SendResult> {
  return send(to, email);
}

export interface EmailLine {
  label: string;
  value: string;
}

export interface OrderEmail {
  subject: string;
  /** The message itself, plain sentences. */
  message: string;
  /** Item rows and totals shown under the message. */
  lines: EmailLine[];
  totals: EmailLine[];
  button: { label: string; url: string };
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function rows(lines: EmailLine[], strong = false): string {
  return lines
    .map(
      (l) =>
        `<tr><td style="padding:6px 0;color:#09070b;${strong ? "font-weight:600;" : ""}">${escapeHtml(l.label)}</td><td style="padding:6px 0;text-align:right;white-space:nowrap;color:#09070b;${strong ? "font-weight:600;" : ""}">${escapeHtml(l.value)}</td></tr>`
    )
    .join("");
}

export function renderOrderEmail(email: OrderEmail): { html: string; text: string } {
  const html = `<!doctype html><html><body style="margin:0;background:#f7f1e8;font-family:Helvetica,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f1e8;padding:32px 16px;"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;">
<tr><td style="background:#241338;padding:24px 32px;color:#f7f1e8;font-family:Georgia,serif;font-size:22px;letter-spacing:0.04em;">Aurum Entonet</td></tr>
<tr><td style="padding:32px;">
<p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#09070b;">${escapeHtml(email.message)}</p>
<p style="margin:0 0 28px;"><a href="${escapeHtml(email.button.url)}" style="display:inline-block;background:#241338;color:#f7f1e8;text-decoration:none;padding:14px 28px;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;">${escapeHtml(email.button.label)}</a></p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;border-top:1px solid #e6dccb;">${rows(email.lines)}</table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;border-top:1px solid #e6dccb;">${rows(email.totals, true)}</table>
</td></tr>
<tr><td style="padding:20px 32px;border-top:1px solid #e6dccb;font-size:12px;color:#6b6257;">Aurum Entonet — a handmade story in Kenya.</td></tr>
</table></td></tr></table></body></html>`;

  const text = [
    email.message,
    "",
    `${email.button.label}: ${email.button.url}`,
    "",
    ...email.lines.map((l) => `${l.label} — ${l.value}`),
    ...email.totals.map((l) => `${l.label}: ${l.value}`),
  ].join("\n");

  return { html, text };
}

/** A branded order email: the message, a button, and the order's items and totals. */
export function sendEmail(to: string[], email: OrderEmail): Promise<SendResult> {
  return send(to, { subject: email.subject, ...renderOrderEmail(email) });
}
