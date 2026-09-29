import { getInquiries } from "@/lib/supabase/inquiries";
import { AdminInquiriesList } from "@/components/admin/AdminInquiriesList";

export default async function AdminInquiriesPage() {
  const inquiries = await getInquiries();
  return (
    <div>
      <h1 className="mb-8 font-display text-3xl">Inquiries</h1>
      <AdminInquiriesList inquiries={inquiries} />
    </div>
  );
}
