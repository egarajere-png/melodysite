import type { SendResult } from "@/lib/notifications/whatsapp";

// Email, sent through Resend (resend.com) from the shop's own domain. Server-only.
// EMAIL_FROM must use a domain that is verified in Resend, e.g.
// "Aurum Entonet <info@aurumentonet.com>"; Resend refuses anything else.

const RESEND_API = "https://api.resend.com";

function apiKey(): string | null {
  return process.env.RESEND_API_KEY?.trim() || null;
}

export function isEmailConfigured(): boolean {
  return Boolean(apiKey() && process.env.EMAIL_FROM?.trim());
}

/** The address part of EMAIL_FROM: "Aurum Entonet <info@x.com>" → "info@x.com". */
function fromAddress(): string {
  const from = process.env.EMAIL_FROM?.trim() ?? "";
  return (from.match(/<([^>]+)>/)?.[1] ?? from).trim();
}

/**
 * Checks the settings without sending anything: the key and sender are present, and —
 * when the key is allowed to read domains — the sender's domain is verified in Resend.
 * Resolves with the problem, or null if everything checked out.
 */
export async function checkEmailSetup(): Promise<{ problem: string | null; note?: string }> {
  const key = apiKey();
  if (!key) return { problem: "RESEND_API_KEY is not set." };
  const from = fromAddress();
  if (!from.includes("@")) return { problem: 'EMAIL_FROM is not set, e.g. "Aurum Entonet <info@aurumentonet.com>".' };
  const domain = from.split("@")[1].toLowerCase();

  try {
    const res = await fetch(`${RESEND_API}/domains`, { headers: { Authorization: `Bearer ${key}` } });
    // A "sending access" key may not list domains; sending is the real test then.
    if (res.status === 401 || res.status === 403) return { problem: null, note: `This API key can't list domains, so ${domain} wasn't checked — the sample emails will show whether it works.` };
    if (!res.ok) return { problem: `Resend answered ${res.status}: ${await res.text()}` };
    const { data } = (await res.json()) as { data?: { name: string; status: string }[] };
    const match = data?.find((d) => d.name.toLowerCase() === domain);
    if (!match) return { problem: `${domain} isn't added in Resend (Domains → Add Domain).` };
    if (match.status !== "verified") return { problem: `${domain} is in Resend but its status is "${match.status}" — its DNS records aren't confirmed yet.` };
    return { problem: null };
  } catch (error) {
    return { problem: error instanceof Error ? error.message : "Could not reach Resend." };
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
  const key = apiKey();
  if (!key || !isEmailConfigured() || recipients.length === 0) return { ok: false, skipped: true };

  const replyTo = email.replyTo || process.env.SUPPORT_EMAIL?.trim();
  try {
    const res = await fetch(`${RESEND_API}/emails`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM!.trim(),
        to: recipients,
        subject: email.subject,
        text: email.text,
        ...(email.html ? { html: email.html } : {}),
        ...(replyTo ? { reply_to: replyTo } : {}),
      }),
    });
    const body = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
    if (!res.ok) return { ok: false, error: body.message ?? `Resend answered ${res.status}` };
    return { ok: true, providerId: body.id };
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
