import { getAdminCategories } from "@/lib/supabase/categories-admin";
import { AdminCategoriesClient } from "@/components/admin/AdminCategoriesClient";

export default async function AdminCategoriesPage() {
  const categories = await getAdminCategories();
  return <AdminCategoriesClient categories={categories} />;
}
