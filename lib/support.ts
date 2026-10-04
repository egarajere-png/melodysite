// The shop's WhatsApp line, for "message us" links. Set NEXT_PUBLIC_WHATSAPP_NUMBER
// (digits only, with country code, e.g. 254712345678); the fallback is a placeholder.
const SUPPORT_WHATSAPP = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "").replace(/\D/g, "") || "254700000000";

export function whatsappLink(text: string): string {
  return `https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(text)}`;
}
