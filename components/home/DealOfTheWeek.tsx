import { getActiveDeal, getProducts } from "@/lib/supabase/catalogue";
import { RevealText } from "@/components/motion/RevealText";
import { ProductCard } from "@/components/product/ProductCard";
import { CountdownTimer } from "@/components/ui/CountdownTimer";
import { formatDate } from "@/lib/format";

export async function DealOfTheWeek() {
  const deal = await getActiveDeal();
  if (!deal) return null;

  const dealProducts = (await getProducts({ dealOnly: true })).filter((p) => deal.productIds.includes(p.id));

  return (
    <section className="bg-aurum-sand/30 py-section">
      <div className="container-aurum">
        <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.3em] text-aurum-obsidian/50">07 — {deal.subtitle}</p>
            <RevealText as="h2" text={deal.title} className="font-display text-3xl sm:text-4xl" />
            <p className="mt-3 text-sm text-aurum-obsidian/60">Ends {formatDate(deal.endsAt)}</p>
          </div>
          <CountdownTimer endsAt={deal.endsAt} />
        </div>

        <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:gap-x-8 lg:grid-cols-4">
          {dealProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
