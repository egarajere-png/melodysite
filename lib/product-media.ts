import type { ImageRef } from "@/lib/types";

// Pure helpers shared by server data modules and client components (no Supabase
// client or server-only imports), so the admin uploader and the storefront agree on
// exactly one way to turn a Storage path into a URL.

export const PRODUCT_MEDIA_BUCKET = "product-media";

/** Supabase's public object URL has a fixed, documented shape, so no client call is needed. */
export function productMediaUrl(storagePath: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${PRODUCT_MEDIA_BUCKET}/${storagePath}`;
}

/** Legacy mock-catalogue rows stored `placeholder:...` markers instead of real files. */
export function isPlaceholderPath(storagePath: string | null | undefined): boolean {
  return !storagePath || storagePath.startsWith("placeholder:");
}

export function storedImageRef(id: string, storagePath: string | null | undefined, alt: string, kind: ImageRef["kind"] = "product"): ImageRef {
  if (isPlaceholderPath(storagePath)) return { id, alt, kind };
  if (storagePath!.startsWith("http") || storagePath!.startsWith("/")) return { id, alt, kind, url: storagePath! };
  return { id, alt, kind, url: productMediaUrl(storagePath!) };
}
