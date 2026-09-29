import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getAdminProduct } from "@/lib/supabase/products-admin";
import { getAdminProductMedia } from "@/lib/supabase/product-media-admin";
import { getCategoryOptions } from "@/lib/supabase/categories-admin";
import { getCollectionOptions } from "@/lib/supabase/collections-admin";
import { ProductForm } from "@/components/admin/ProductForm";
import { ProductMediaManager } from "@/components/admin/ProductMediaManager";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, media, categories, collections] = await Promise.all([getAdminProduct(id), getAdminProductMedia(id), getCategoryOptions(), getCollectionOptions()]);
  if (!product) notFound();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link href="/admin/products" className="mb-3 flex w-fit items-center gap-1.5 text-xs uppercase tracking-widest text-aurum-obsidian/50 hover:text-aurum-obsidian">
          <ArrowLeft size={13} strokeWidth={1.5} />
          All products
        </Link>
        <h1 className="font-display text-3xl">{product.name}</h1>
      </div>
      {/* Both components hold local state seeded from these props. Keying them on the
          saved variants makes them remount after a save adds/removes variants or colours,
          so the form never re-submits a just-created variant without its new id. */}
      <ProductMediaManager key={media.colours.map((c) => `${c.colour}:${c.variantId}`).join("|")} productId={product.id} productName={product.name} initialMedia={media} />
      <ProductForm key={product.variants.map((v) => v.id).join("|")} product={product} categories={categories} collections={collections} />
    </div>
  );
}
