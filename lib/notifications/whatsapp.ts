import { toMpesaMsisdn } from "@/lib/payments/phone";

// WhatsApp Business (Meta Cloud API) sender. Server-only. A business can only start a
// conversation with a pre-approved template, so every message here is a template send;
// the templates themselves are listed in docs/whatsapp-templates.md.

const GRAPH_URL = "https://graph.facebook.com/v22.0";

export interface SendResult {
  ok: boolean;
  /** True when the channel isn't set up or there is nobody to send to — not an error. */
  skipped?: boolean;
  providerId?: string;
  error?: string;
}

export function isWhatsappConfigured(): boolean {
  return Boolean(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
}

/**
 * Digits-only international number, as WhatsApp expects. Kenyan numbers may be given
 * locally (07…); anything else must already carry its country code (+44…).
 */
export function toWhatsappNumber(value: string | null | undefined): string | null {
  if (!value) return null;
  const kenyan = toMpesaMsisdn(value);
  if (kenyan) return kenyan;
  const compact = value.replace(/[\s\-()]/g, "");
  return /^\+\d{9,15}$/.test(compact) ? compact.slice(1) : null;
}

/** Template values can't contain line breaks, tabs or runs of spaces. */
function cleanParam(value: string): string {
  return value.replace(/\s+/g, " ").trim().slice(0, 900) || "-";
}

export async function sendWhatsappTemplate(to: string | null | undefined, template: string, params: string[]): Promise<SendResult> {
  const number = toWhatsappNumber(to);
  if (!isWhatsappConfigured() || !number) return { ok: false, skipped: true };

  try {
    const response = await fetch(`${GRAPH_URL}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: number,
        type: "template",
        template: {
          name: template,
          language: { code: process.env.WHATSAPP_TEMPLATE_LANGUAGE || "en" },
          components: [{ type: "body", parameters: params.map((text) => ({ type: "text", text: cleanParam(text) })) }],
        },
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
    const body = (await response.json().catch(() => null)) as { messages?: { id?: string }[]; error?: { message?: string } } | null;
    if (!response.ok) return { ok: false, error: body?.error?.message ?? `WhatsApp API responded ${response.status}` };
    return { ok: true, providerId: body?.messages?.[0]?.id };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "WhatsApp request failed" };
  }
}
