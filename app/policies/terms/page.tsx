import type { Metadata } from "next";
import { SimplePage } from "@/components/ui/SimplePageHeader";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <SimplePage title="Terms of Service">
      <p>
        By using this site and purchasing from Aurum Entonet, you agree to our terms of sale, including product
        descriptions, pricing in Kenyan Shillings (KES), and order acceptance at our discretion.
      </p>
      <p className="text-aurum-obsidian/45">
        Full legal terms to be published prior to launch, in consultation with the client and legal counsel.
      </p>
    </SimplePage>
  );
}
