import Link from "next/link";
import { categories } from "@/data/categories";
import { RevealText } from "@/components/motion/RevealText";
import { StaggerContainer, StaggerItem } from "@/components/motion/StaggerChildren";
import { ScaleOnHover } from "@/components/motion/ScaleOnHover";
import { EditorialImage } from "@/components/ui/EditorialImage";

export function ShopByCategory() {
  return (
    <section className="bg-aurum-ivory pb-section">
      <div className="container-aurum">
        <div className="mb-10 flex items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.3em] text-aurum-obsidian/50">03 — The Edit</p>
            <RevealText as="h2" text="Shop by Category" className="font-display text-3xl sm:text-4xl" />
          </div>
          <Link href="/shop" className="hidden text-xs uppercase tracking-widest underline underline-offset-4 sm:block">
            View all
          </Link>
        </div>

        <StaggerContainer className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
          {categories.map((category) => (
            <StaggerItem key={category.slug}>
              <Link href={`/shop?category=${category.slug}`} data-cursor="shop" className="group block">
                <ScaleOnHover className="aspect-[3/4] w-full overflow-hidden" scale={1.06}>
                  <div className="relative h-full w-full">
                    <EditorialImage image={category.image} className="h-full w-full" />
                    <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/45 via-transparent to-transparent p-4">
                      <span className="font-display text-lg text-aurum-ivory sm:text-xl">{category.name}</span>
                    </div>
                  </div>
                </ScaleOnHover>
              </Link>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
