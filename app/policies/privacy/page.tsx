import type { Metadata } from "next";
import { PolicySection, SimplePage } from "@/components/ui/SimplePageHeader";
import { CONTACT } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "What personal information Aurum Entonet collects, why, who it is shared with, and your rights.",
};

const PROVIDERS = [
  { name: "Safaricom (M-Pesa)", why: "to take your payment — your M-Pesa number and the amount" },
  { name: "Pick Up Mtaani", why: "to deliver your order — the collector's name, phone number and chosen agent" },
  { name: "Supabase", why: "to store your account, bag and orders securely" },
  { name: "Vercel", why: "to host and run this website" },
  { name: "Resend", why: "to send our emails to you" },
  { name: "Meta (WhatsApp)", why: "to send your order updates on WhatsApp" },
  { name: "Google", why: "to let you sign in with Google, if you choose to" },
];

export default function PrivacyPage() {
  return (
    <SimplePage title="Privacy Policy" updated="21 October 2026">
      <p>
        Aurum Entonet, based in Kahawa Sukari, Nairobi, Kenya, respects your privacy. This policy explains what personal
        information we collect when you use our website and buy from us, why we need it, and the choices you have. We handle your
        information in line with Kenya&apos;s Data Protection Act, 2019.
      </p>

      <PolicySection title="What we collect">
        <ul className="ml-5 list-disc space-y-2">
          <li>
            <strong className="font-medium text-aurum-obsidian">Your account:</strong> your name and email address, and a password
            or your Google sign-in. If you sign in with Google, Google shares your name, email address and profile picture with us.
          </li>
          <li>
            <strong className="font-medium text-aurum-obsidian">Your orders:</strong> what you buy, your phone number, your chosen
            Pick Up Mtaani agent or town (or shop pickup), the name and phone number of whoever is collecting, and any gift message.
          </li>
          <li>
            <strong className="font-medium text-aurum-obsidian">Payments:</strong> the M-Pesa number you pay from, the amount and
            the M-Pesa receipt number. We never see or store your M-Pesa PIN.
          </li>
          <li>
            <strong className="font-medium text-aurum-obsidian">Messages to us:</strong> what you send through our contact form,
            email or WhatsApp.
          </li>
          <li>
            <strong className="font-medium text-aurum-obsidian">Your bag and wishlist:</strong> the pieces you save, so they are
            still there next time.
          </li>
        </ul>
      </PolicySection>

      <PolicySection title="How we use it">
        <ul className="ml-5 list-disc space-y-2">
          <li>To process and deliver your order, and to take payment.</li>
          <li>To send you order updates by email and WhatsApp — when your order is placed, paid, dispatched and ready to collect.</li>
          <li>To reply to your questions and handle returns, refunds and complaints.</li>
          <li>To keep our records and accounts, and to protect our customers and our business against fraud.</li>
        </ul>
        <p>We do not sell your personal information, and we do not send you marketing messages unless you have asked to receive them.</p>
      </PolicySection>

      <PolicySection title="Who we share it with">
        <p>We share only what is needed with the trusted services that help us run the shop:</p>
        <div className="border border-[var(--border-strong)]">
          {PROVIDERS.map((p) => (
            <div key={p.name} className="flex flex-col gap-0.5 border-b border-[var(--border-subtle)] px-4 py-3 last:border-0 sm:flex-row sm:gap-4">
              <span className="shrink-0 font-medium text-aurum-obsidian sm:w-44">{p.name}</span>
              <span>{p.why}</span>
            </div>
          ))}
        </div>
        <p>
          Some of these services store information on servers outside Kenya. We only use providers that protect personal
          information to a high standard. We may also share information when the law requires it.
        </p>
      </PolicySection>

      <PolicySection title="Cookies and storage">
        <p>
          We use only the cookies and browser storage the website needs to work — to keep you signed in and remember your bag
          and wishlist. We do not use advertising or tracking cookies.
        </p>
      </PolicySection>

      <PolicySection title="How long we keep it">
        <p>
          We keep your account details for as long as you have an account. Order and payment records are kept for as long as
          the law requires us to keep business and tax records. Messages to us are kept for as long as needed to help you.
        </p>
      </PolicySection>

      <PolicySection title="Keeping it safe">
        <p>
          Your information is sent over a secure, encrypted connection, and access to customer details is limited to the Aurum
          Entonet team members who need it to serve you.
        </p>
      </PolicySection>

      <PolicySection title="Your rights">
        <p>
          You can ask to see the personal information we hold about you, to correct it, or to delete it (unless we must keep
          it by law, such as records of a purchase). You can also object to how we use it. To do any of these, email{" "}
          <a href={`mailto:${CONTACT.email}`} className="underline underline-offset-4">
            {CONTACT.email}
          </a>
          . If you are not satisfied with our response, you may complain to the Office of the Data Protection Commissioner
          (ODPC) in Kenya.
        </p>
      </PolicySection>

      <PolicySection title="Changes to this policy">
        <p>If we change this policy, we will update it on this page and change the date at the top.</p>
      </PolicySection>

      <PolicySection title="Contact">
        <p>
          Questions about your privacy? Email us at {CONTACT.email} or message us on WhatsApp at {CONTACT.whatsappDisplay}.
        </p>
      </PolicySection>
    </SimplePage>
  );
}
