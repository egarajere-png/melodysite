import { ParallaxImage } from "@/components/motion/ParallaxImage";
import { RevealText } from "@/components/motion/RevealText";
import { FadeIn } from "@/components/motion/FadeIn";

const storyImage = { id: "home-editorial-story", alt: "Aurum Entonet editorial story", kind: "editorial" as const, tone: "plum" as const };

export function EditorialStory() {
  return (
    <section className="relative h-[85vh] min-h-[560px] overflow-hidden bg-aurum-deep text-aurum-ivory">
      <ParallaxImage image={storyImage} className="absolute inset-0 h-full w-full" strength={70} />
      <div className="absolute inset-0 bg-gradient-to-r from-aurum-obsidian/70 via-aurum-obsidian/20 to-transparent" />

      <div className="container-aurum relative z-10 flex h-full items-center">
        <div className="max-w-lg">
          <p className="mb-4 text-xs uppercase tracking-[0.3em] text-aurum-ivory/50">05 — Philosophy</p>
          <RevealText
            as="h2"
            text="More than jewellery."
            className="font-display text-4xl leading-[1.05] sm:text-6xl"
          />
          <FadeIn delay={0.4}>
            <p className="mt-6 text-sm leading-relaxed text-aurum-ivory/80 sm:text-base">
              Every Aurum piece begins as an idea sketched by hand, then cast, finished and inspected in small
              batches. It&apos;s a slower way of making jewellery — one that leaves room for a story in every piece.
            </p>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
