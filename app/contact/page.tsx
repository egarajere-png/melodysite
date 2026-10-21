import type { Metadata } from "next";
import { RevealText } from "@/components/motion/RevealText";
import { FadeIn } from "@/components/motion/FadeIn";
import { ContactForm } from "@/components/contact/ContactForm";
import { CONTACT, WHATSAPP_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with Aurum Entonet — Nairobi, Kenya.",
};

export default function ContactPage() {
  return (
    <div className="pt-32 pb-24 sm:pt-40 sm:pb-32">
      <div className="container-aurum grid gap-16 lg:grid-cols-2 lg:gap-24">
        <div>
          <RevealText as="h1" text="Let's Talk." className="font-display text-5xl sm:text-7xl" />
          <FadeIn delay={0.3}>
            <p className="mt-6 max-w-md text-sm leading-relaxed text-aurum-obsidian/70 sm:text-base">
              Questions about a piece, custom orders, wholesale, or press — reach out and we&apos;ll get back to you
              directly.
            </p>
          </FadeIn>

          <div className="mt-12 flex flex-col gap-8 text-sm">
            <div>
              <p className="mb-1 text-xs uppercase tracking-widest text-aurum-obsidian/50">Studio</p>
              <p>Kahawa Sukari, Nairobi, Kenya</p>
            </div>
            <div>
              <p className="mb-1 text-xs uppercase tracking-widest text-aurum-obsidian/50">Email</p>
              <a href={`mailto:${CONTACT.email}`} className="hover:underline">
                {CONTACT.email}
              </a>
            </div>
            <div>
              <p className="mb-1 text-xs uppercase tracking-widest text-aurum-obsidian/50">WhatsApp</p>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noreferrer"
                className="hover:underline"
              >
                {CONTACT.whatsappDisplay}
              </a>
            </div>
            <div>
              <p className="mb-1 text-xs uppercase tracking-widest text-aurum-obsidian/50">Instagram</p>
              <a href={CONTACT.instagram} target="_blank" rel="noreferrer" className="hover:underline">
                {CONTACT.handle}
              </a>
            </div>
            <div>
              <p className="mb-1 text-xs uppercase tracking-widest text-aurum-obsidian/50">TikTok</p>
              <a href={CONTACT.tiktok} target="_blank" rel="noreferrer" className="hover:underline">
                {CONTACT.handle}
              </a>
            </div>
          </div>
        </div>

        <ContactForm />
      </div>
    </div>
  );
}
