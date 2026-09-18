import Link from "next/link";
import { getBestsellers, effectivePrice } from "@/data/products";
import { RevealText } from "@/components/motion/RevealText";
import { StaggerContainer, StaggerItem } from "@/components/motion/StaggerChildren";
import { EditorialImage } from "@/components/ui/EditorialImage";
import { formatKES } from "@/lib/format";

/**
 * Deliberately not a card grid — Hot Arrivals already owns that treatment. Bestsellers
 * reads as an editorial "top picks" list: large index numerals, a small thumbnail,
 * full-bleed hairline rules between rows.
 */
export function Bestsellers() {
  const bestsellers = getBestsellers(4);

  return (
    <section className="border-t border-[var(--border-subtle)] bg-aurum-ivory py-section">
      <div className="container-aurum">
        <div className="mb-10">
          <p className="mb-2 text-xs uppercase tracking-[0.3em] text-aurum-obsidian/50">06 — Most Loved</p>
          <RevealText as="h2" text="Bestsellers" className="font-display text-3xl sm:text-4xl" />
        </div>

        <StaggerContainer className="border-t border-[var(--border-subtle)]">
          {bestsellers.map((product, i) => (
            <StaggerItem key={product.id}>
              <Link
                href={`/shop/${product.slug}`}
                data-cursor="view"
                className="group flex items-center gap-5 border-b border-[var(--border-subtle)] py-6 sm:gap-10 sm:py-8"
              >
                <span className="w-10 shrink-0 font-display text-2xl italic text-aurum-obsidian/30 sm:w-16 sm:text-4xl">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="h-16 w-16 shrink-0 overflow-hidden sm:h-24 sm:w-24">
                  <EditorialImage image={product.images[0]} className="h-full w-full" />
                </div>
                <span className="min-w-0 flex-1 truncate font-display text-lg transition-opacity group-hover:opacity-60 sm:text-2xl">
                  {product.name}
                </span>
                <span className="shrink-0 text-sm text-aurum-obsidian/70 sm:text-base">
                  {formatKES(effectivePrice(product))}
                </span>
              </Link>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
