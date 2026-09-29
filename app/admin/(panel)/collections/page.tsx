import { getAdminCollections } from "@/lib/supabase/collections-admin";
import { getAdminProductList } from "@/lib/supabase/products-admin";
import { AdminCollectionsClient } from "@/components/admin/AdminCollectionsClient";

export default async function AdminCollectionsPage() {
  const [collections, products] = await Promise.all([getAdminCollections(), getAdminProductList()]);
  return <AdminCollectionsClient collections={collections} products={products.map((p) => ({ id: p.id, name: p.name, isActive: p.isActive }))} />;
}
