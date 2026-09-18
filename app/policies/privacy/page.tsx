import type { Metadata } from "next";
import { SimplePage } from "@/components/ui/SimplePageHeader";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <SimplePage title="Privacy Policy">
      <p>
        We collect only the information needed to process your order and respond to enquiries — your name,
        contact details, delivery address and order history. We do not sell customer data to third parties.
      </p>
      <p className="text-aurum-obsidian/45">
        Full privacy policy, including data retention and third-party processors (payment, delivery, email), to
        be published prior to launch.
      </p>
    </SimplePage>
  );
}
