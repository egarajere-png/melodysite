import { notFound } from "next/navigation";
import { getAdminProduct } from "@/lib/supabase/products-admin";
import { getActiveCategories, getCollections } from "@/lib/supabase/catalogue";
import { ProductForm } from "@/components/admin/ProductForm";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, categories, collections] = await Promise.all([getAdminProduct(id), getActiveCategories(), getCollections()]);
  if (!product) notFound();

  return (
    <div>
      <h1 className="mb-8 font-display text-3xl">{product.name}</h1>
      <ProductForm product={product} categories={categories} collections={collections} />
    </div>
  );
}
