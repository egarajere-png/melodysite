import { getAdminDeliverySettings } from "@/lib/supabase/delivery-admin";
import { AdminDeliveryClient } from "@/components/admin/AdminDeliveryClient";

export default async function AdminDeliveryPage() {
  const settings = await getAdminDeliverySettings();
  return <AdminDeliveryClient settings={settings} />;
}
