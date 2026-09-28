import { createClient } from "@/lib/supabase/server";

export type InquiryStatus = "NEW" | "READ" | "IN_PROGRESS" | "RESOLVED";

export interface Inquiry {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  status: InquiryStatus;
  createdAt: string;
}

/** RLS ("staff inquiries"/"staff inquiries update") restricts both to is_staff(),
 * so the cookie-based client is sufficient. */

export async function getInquiries(): Promise<Inquiry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contact_inquiries")
    .select("id, name, email, phone, subject, message, status, created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((i) => ({
    id: i.id,
    name: i.name,
    email: i.email,
    phone: i.phone,
    subject: i.subject,
    message: i.message,
    status: i.status as InquiryStatus,
    createdAt: i.created_at,
  }));
}

export async function updateInquiryStatus(id: string, status: InquiryStatus): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("contact_inquiries").update({ status }).eq("id", id);
  if (error) throw error;
}
