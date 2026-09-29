import { ProductForm } from "@/components/admin/ProductForm";
import { getCategoryOptions } from "@/lib/supabase/categories-admin";
import { getCollectionOptions } from "@/lib/supabase/collections-admin";

export default async function NewProductPage() {
  const [categories, collections] = await Promise.all([getCategoryOptions(), getCollectionOptions()]);
  return (
    <div>
      <h1 className="mb-2 font-display text-3xl">New Product</h1>
      <p className="mb-8 text-sm text-aurum-obsidian/50">Fill in the details and variants, then create the product — you&apos;ll go straight to its page to upload the main, hover and colour images.</p>
      <ProductForm categories={categories} collections={collections} />
    </div>
  );
}
