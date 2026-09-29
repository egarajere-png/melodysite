import { createPublicClient } from "@/lib/supabase/public";

/** A priced place inside a delivery group, e.g. "Langata — KSh 300". Stored in shipping_rates. */
export interface DeliveryArea {
  id: string;
  name: string;
  amount: number;
  deliveryEstimate: string | null;
}

/** A delivery group, e.g. "Nairobi", with its areas cheapest-first. Stored in shipping_zones. */
export interface DeliveryGroup {
  id: string;
  name: string;
  description: string | null;
  areas: DeliveryArea[];
  minAmount: number;
  maxAmount: number;
}

export interface PickupLocation {
  id: string;
  name: string;
  address: string;
  hours: string | null;
  directions: string | null;
}

export interface DeliveryOptions {
  groups: DeliveryGroup[];
  pickupLocations: PickupLocation[];
}

function byPriceThenName(a: { amount: number; name: string }, b: { amount: number; name: string }) {
  return a.amount - b.amount || a.name.localeCompare(b.name);
}

/** Everything checkout needs. RLS already hides inactive groups/areas/pickups from
 * the public, but the filters are repeated so staff sessions see the customer view too. */
export async function getDeliveryOptions(): Promise<DeliveryOptions> {
  const supabase = createPublicClient();
  const [{ data: zones, error }, { data: pickups, error: pickupError }] = await Promise.all([
    supabase
      .from("shipping_zones")
      .select("id, name, description, sort_order, is_active, shipping_rates ( id, name, amount, delivery_estimate, is_active )")
      .eq("is_active", true)
      .order("sort_order")
      .order("name"),
    supabase.from("pickup_locations").select("id, name, address, hours, directions").eq("is_active", true).order("sort_order").order("name"),
  ]);
  if (error) throw error;
  if (pickupError) throw pickupError;

  const groups = (zones ?? [])
    .map((z) => {
      const areas = (z.shipping_rates as { id: string; name: string; amount: number; delivery_estimate: string | null; is_active: boolean }[])
        .filter((r) => r.is_active)
        .map((r) => ({ id: r.id, name: r.name, amount: Number(r.amount), deliveryEstimate: r.delivery_estimate }))
        .sort(byPriceThenName);
      return {
        id: z.id,
        name: z.name,
        description: z.description,
        areas,
        minAmount: areas.length ? areas[0].amount : 0,
        maxAmount: areas.length ? Math.max(...areas.map((a) => a.amount)) : 0,
      };
    })
    .filter((g) => g.areas.length > 0);

  return { groups, pickupLocations: pickups ?? [] };
}
