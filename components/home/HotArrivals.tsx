import { getNewArrivals } from "@/lib/supabase/catalogue";
import { RevealText } from "@/components/motion/RevealText";
import { ProductCard } from "@/components/product/ProductCard";

export async function HotArrivals() {
  const arrivals = await getNewArrivals(8);

  return (
    <section className="border-t border-[var(--border-subtle)] bg-aurum-ivory py-section">
      <div className="container-aurum">
        <div className="mb-10 flex items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.3em] text-aurum-obsidian/50">04 — This Month</p>
            <RevealText as="h2" text="Hot Arrivals" className="font-display text-3xl sm:text-4xl" />
          </div>
        </div>
      </div>

      <div className="no-scrollbar flex gap-5 overflow-x-auto px-[var(--gutter)] pb-4 sm:gap-8">
        {arrivals.map((product) => (
          <ProductCard key={product.id} product={product} className="w-[68vw] shrink-0 sm:w-[320px]" />
        ))}
      </div>
    </section>
  );
}
