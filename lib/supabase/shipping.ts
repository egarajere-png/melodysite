import { createPublicClient } from "@/lib/supabase/public";

export interface ShippingRate {
  id: string;
  zoneName: string;
  name: string;
  amount: number;
}

export async function getShippingRates(): Promise<ShippingRate[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("shipping_rates")
    .select("id, name, amount, shipping_zones ( name )")
    .eq("is_active", true);
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    zoneName: (r.shipping_zones as unknown as { name: string } | null)?.name ?? "",
    name: r.name,
    amount: Number(r.amount),
  }));
}
