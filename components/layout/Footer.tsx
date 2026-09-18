import Link from "next/link";
import { RevealText } from "@/components/motion/RevealText";

const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Shop",
    links: [
      { label: "All Products", href: "/shop" },
      { label: "New Arrivals", href: "/shop?sort=new" },
      { label: "Bestsellers", href: "/shop?sort=bestsellers" },
      { label: "The Aurum Edit", href: "/shop?deal=true" },
    ],
  },
  {
    title: "The House",
    links: [
      { label: "About Aurum", href: "/about" },
      { label: "Contact", href: "/contact" },
      { label: "Order Status", href: "/orders" },
    ],
  },
  {
    title: "Policies",
    links: [
      { label: "Shipping & Returns", href: "/policies/shipping-returns" },
      { label: "Terms of Service", href: "/policies/terms" },
      { label: "Privacy Policy", href: "/policies/privacy" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="bg-aurum-obsidian text-aurum-ivory">
      <div className="container-aurum py-16 sm:py-24">
        <RevealText
          as="h2"
          text="From Africa, with a story."
          className="max-w-3xl font-display text-4xl leading-[1.05] sm:text-6xl"
        />

        <div className="mt-16 grid grid-cols-2 gap-10 border-t border-aurum-ivory/10 pt-12 sm:grid-cols-4">
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="mb-4 text-xs uppercase tracking-widest text-aurum-ivory/50">{col.title}</h3>
              <ul className="flex flex-col gap-2.5 text-sm">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="transition-opacity hover:opacity-60">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div>
            <h3 className="mb-4 text-xs uppercase tracking-widest text-aurum-ivory/50">Connect</h3>
            <ul className="flex flex-col gap-2.5 text-sm">
              <li>
                <a href="https://instagram.com" target="_blank" rel="noreferrer" className="transition-opacity hover:opacity-60">
                  Instagram
                </a>
              </li>
              <li>
                <a href="https://wa.me/254700000000" target="_blank" rel="noreferrer" className="transition-opacity hover:opacity-60">
                  WhatsApp
                </a>
              </li>
              <li>
                <a href="mailto:hello@aurumentonet.co.ke" className="transition-opacity hover:opacity-60">
                  hello@aurumentonet.co.ke
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-4 border-t border-aurum-ivory/10 pt-6 text-xs text-aurum-ivory/40 sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} Aurum Entonet. A Handmade Story in Kenya.</p>
          <p>Nairobi, Kenya</p>
        </div>
      </div>
    </footer>
  );
}
