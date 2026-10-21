import { CONTACT } from "@/lib/site";

// The shop's WhatsApp line, for "message us" links. NEXT_PUBLIC_WHATSAPP_NUMBER (digits
// only, with country code) overrides the number in lib/site.ts.
const SUPPORT_WHATSAPP = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "").replace(/\D/g, "") || CONTACT.whatsapp;

export function whatsappLink(text: string): string {
  return `https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(text)}`;
}
