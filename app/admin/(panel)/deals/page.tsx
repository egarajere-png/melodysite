import { getAdminDeals } from "@/lib/supabase/deals-admin";
import { getAdminProductList } from "@/lib/supabase/products-admin";
import { AdminDealsClient } from "@/components/admin/AdminDealsClient";

export default async function AdminDealsPage() {
  const [deals, products] = await Promise.all([getAdminDeals(), getAdminProductList()]);
  return <AdminDealsClient deals={deals} products={products.map((p) => ({ id: p.id, name: p.name, isActive: p.isActive }))} />;
}
