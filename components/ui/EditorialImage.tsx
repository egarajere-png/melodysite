import Image from "next/image";
import type { ImageRef } from "@/lib/types";

/**
 * Renders a real photo when `image.url` is set: a Supabase Storage URL for product
 * photos, or a /images/... path for site imagery (see lib/site-images.ts). Anything
 * without a URL yet (e.g. a product with no uploaded photos) gets a plain, quiet
 * surface rather than invented artwork.
 */
export function EditorialImage({
  image,
  className = "",
  priority = false,
  sizes = "(min-width: 1024px) 50vw, 100vw",
}: {
  image: ImageRef | undefined;
  className?: string;
  priority?: boolean;
  sizes?: string;
}) {
  if (image?.url) {
    return (
      <div className={`relative isolate overflow-hidden ${className}`}>
        <Image src={image.url} alt={image.alt} fill priority={priority} sizes={sizes} className="object-cover" />
      </div>
    );
  }

  return (
    <div
      role="img"
      aria-label={image?.alt || "Image coming soon"}
      className={`relative isolate flex items-center justify-center overflow-hidden bg-[#ece3d4] ${className}`}
    >
      <span aria-hidden className="px-2 text-center text-[10px] uppercase tracking-[0.3em] text-aurum-obsidian/35">
        Image coming soon
      </span>
    </div>
  );
}
