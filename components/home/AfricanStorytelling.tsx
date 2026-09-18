import { ImageReveal } from "@/components/motion/ImageReveal";
import { RevealText } from "@/components/motion/RevealText";
import { FadeIn } from "@/components/motion/FadeIn";
import { EditorialImage } from "@/components/ui/EditorialImage";

const textureImage = { id: "home-storytelling", alt: "Natural materials and texture, Aurum Entonet", kind: "editorial" as const, tone: "earth" as const };

export function AfricanStorytelling() {
  return (
    <section className="bg-aurum-obsidian py-section text-aurum-ivory">
      <div className="container-aurum grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
        <ImageReveal className="aspect-[4/5] w-full">
          <EditorialImage image={textureImage} className="h-full w-full" />
        </ImageReveal>

        <div>
          <p className="mb-3 text-xs uppercase tracking-[0.3em] text-aurum-ivory/50">08 — Craftsmanship</p>
          <RevealText
            as="h2"
            text="Made by hand, in Kenya."
            className="font-display text-4xl leading-[1.05] sm:text-5xl"
          />
          <FadeIn delay={0.35}>
            <p className="mt-6 max-w-md text-sm leading-relaxed text-aurum-ivory/75 sm:text-base">
              Each piece moves through a small studio — sketched, cast, hand-finished and checked before it ever
              reaches a customer. It&apos;s a deliberately unhurried process, built around craft rather than speed.
            </p>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-aurum-ivory/50">
              Full brand story and studio details coming soon.
            </p>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
