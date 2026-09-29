import { getContentBlocks } from "@/lib/supabase/content-admin";
import { AdminContentClient } from "@/components/admin/AdminContentClient";

export default async function AdminContentPage() {
  const blocks = await getContentBlocks();
  return <AdminContentClient blocks={blocks} />;
}
