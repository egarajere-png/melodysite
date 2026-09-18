import { RevealText } from "@/components/motion/RevealText";

export function BrandStatement() {
  return (
    <section className="bg-aurum-ivory py-section-lg">
      <div className="container-aurum grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-9">
          <RevealText
            as="h2"
            text="Rooted in Africa."
            className="font-display text-4xl leading-[1.05] sm:text-6xl lg:text-7xl"
          />
          <RevealText
            as="h2"
            text="Made for now."
            delay={0.15}
            className="font-display text-4xl italic leading-[1.05] text-aurum-obsidian/50 sm:text-6xl lg:text-7xl"
          />
        </div>
        <div className="flex items-end lg:col-span-3">
          <p className="text-xs uppercase tracking-[0.3em] text-aurum-obsidian/40">02 — Statement</p>
        </div>
      </div>
    </section>
  );
}
