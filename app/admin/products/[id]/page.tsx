import { notFound } from "next/navigation";
import { products } from "@/data/products";
import { ProductForm } from "@/components/admin/ProductForm";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = products.find((p) => p.id === id);
  if (!product) notFound();

  return (
    <div>
      <h1 className="mb-8 font-display text-3xl">{product.name}</h1>
      <ProductForm product={product} />
    </div>
  );
}
