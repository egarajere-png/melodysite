import { getAdminCollections } from "@/lib/supabase/collections-admin";
import { AdminCollectionsClient } from "@/components/admin/AdminCollectionsClient";

export default async function AdminCollectionsPage() {
  const collections = await getAdminCollections();
  return <AdminCollectionsClient collections={collections} />;
}
