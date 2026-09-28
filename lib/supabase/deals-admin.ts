import { createClient } from "@/lib/supabase/server";

export interface AdminDeal {
  id: string;
  title: string;
  discountPercent: number;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  productCount: number;
}

export async function getAdminDeals(): Promise<AdminDeal[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("deals")
    .select("id, title, discount_percent, starts_at, ends_at, is_active, deal_products ( product_id )")
    .order("starts_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((d) => ({
    id: d.id,
    title: d.title,
    discountPercent: Number(d.discount_percent),
    startsAt: d.starts_at,
    endsAt: d.ends_at,
    isActive: d.is_active,
    productCount: (d.deal_products as unknown[]).length,
  }));
}

export interface CreateDealInput {
  title: string;
  discountPercent: number;
  startsAt: string;
  endsAt: string;
  productIds: string[];
}

export async function createDeal(input: CreateDealInput): Promise<void> {
  const supabase = await createClient();
  const { data: deal, error } = await supabase
    .from("deals")
    .insert({
      title: input.title,
      placement: "homepage",
      discount_percent: input.discountPercent,
      starts_at: new Date(input.startsAt).toISOString(),
      ends_at: new Date(input.endsAt).toISOString(),
      is_active: true,
    })
    .select("id")
    .single();
  if (error) throw error;

  if (input.productIds.length) {
    const { error: linkErr } = await supabase.from("deal_products").insert(input.productIds.map((productId) => ({ deal_id: deal.id, product_id: productId })));
    if (linkErr) throw linkErr;
  }
}

export async function setDealActive(id: string, isActive: boolean): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("deals").update({ is_active: isActive }).eq("id", id);
  if (error) throw error;
}
