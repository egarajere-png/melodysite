import { ProductForm } from "@/components/admin/ProductForm";
import { getActiveCategories, getCollections } from "@/lib/supabase/catalogue";

export default async function NewProductPage() {
  const [categories, collections] = await Promise.all([getActiveCategories(), getCollections()]);
  return (
    <div>
      <h1 className="mb-8 font-display text-3xl">New Product</h1>
      <ProductForm categories={categories} collections={collections} />
    </div>
  );
}
