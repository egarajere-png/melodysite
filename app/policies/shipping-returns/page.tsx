import type { Metadata } from "next";
import { SimplePage } from "@/components/ui/SimplePageHeader";

export const metadata: Metadata = { title: "Shipping & Returns" };

export default function ShippingReturnsPage() {
  return (
    <SimplePage title="Shipping & Returns">
      <p>
        Most pieces ship within 3–7 working days across Kenya, and 10–14 days internationally; made-to-order
        pieces may take slightly longer, as noted on each product page.
      </p>
      <p>
        Unworn pieces in original packaging can be exchanged within 14 days of delivery. Pierced and body
        jewellery is final sale for hygiene reasons unless faulty.
      </p>
      <p className="text-aurum-obsidian/45">
        Full shipping rates, carrier details and return process to be confirmed before launch.
      </p>
    </SimplePage>
  );
}
