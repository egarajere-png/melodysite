import { getAdminProductList } from "@/lib/supabase/products-admin";
import { AdminProductsTable } from "@/components/admin/AdminProductsTable";

export default async function AdminProductsPage() {
  const products = await getAdminProductList();
  return <AdminProductsTable products={products} />;
}
