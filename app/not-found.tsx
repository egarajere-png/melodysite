import Link from "next/link";
import { RevealText } from "@/components/motion/RevealText";
import { FadeIn } from "@/components/motion/FadeIn";
import { MagneticButton } from "@/components/motion/MagneticButton";
import { EditorialImage } from "@/components/ui/EditorialImage";

export default function NotFound() {
  return (
    <div className="relative flex min-h-[85vh] items-center overflow-hidden bg-aurum-obsidian text-aurum-ivory">
      <div className="pointer-events-none absolute -right-24 top-1/2 hidden h-[520px] w-[420px] -translate-y-1/2 opacity-40 md:block">
        <EditorialImage
          image={{ id: "404-piece", alt: "", kind: "product", tone: "plum" }}
          className="h-full w-full"
        />
      </div>

      <div className="container-aurum relative z-10">
        <p className="mb-4 font-display text-lg tracking-[0.3em] text-aurum-ivory/50">404</p>
        <RevealText
          as="h1"
          text="The piece you're looking for"
          className="max-w-xl font-display text-4xl leading-[1.05] sm:text-6xl"
        />
        <RevealText
          as="h1"
          text="has left the collection."
          delay={0.15}
          className="max-w-xl font-display text-4xl italic leading-[1.05] text-aurum-ivory/60 sm:text-6xl"
        />

        <FadeIn delay={0.5}>
          <div className="mt-10 flex flex-wrap gap-4">
            <MagneticButton>
              <Link
                href="/"
                data-cursor="view"
                className="inline-flex items-center bg-aurum-ivory px-8 py-4 text-xs uppercase tracking-[0.2em] text-aurum-obsidian transition-colors hover:bg-aurum-gold"
              >
                Return Home
              </Link>
            </MagneticButton>
            <MagneticButton>
              <Link
                href="/shop"
                data-cursor="view"
                className="inline-flex items-center border border-aurum-ivory/40 px-8 py-4 text-xs uppercase tracking-[0.2em] transition-colors hover:border-aurum-ivory"
              >
                Shop the Collection
              </Link>
            </MagneticButton>
          </div>
        </FadeIn>
      </div>
    </div>
  );
}
