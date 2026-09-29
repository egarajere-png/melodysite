import { createClient } from "@/lib/supabase/server";

/**
 * Staff management of delivery groups (shipping_zones), the priced areas inside them
 * (shipping_rates) and pickup points. RLS limits writes to is_staff().
 *
 * orders.shipping_rate_id references an area, so an area (or a group containing one)
 * that past orders used can't be hard-deleted — it's hidden instead, keeping order
 * history intact. Orders also keep their own snapshot of the names and price.
 */

export interface AdminArea {
  id: string;
  name: string;
  amount: number;
  deliveryEstimate: string | null;
  isActive: boolean;
}

export interface AdminGroup {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
  areas: AdminArea[];
}

export interface AdminPickup {
  id: string;
  name: string;
  address: string;
  hours: string | null;
  directions: string | null;
  isActive: boolean;
}

export interface AdminDeliverySettings {
  groups: AdminGroup[];
  pickups: AdminPickup[];
}

export class DeliveryError extends Error {}

type Client = Awaited<ReturnType<typeof createClient>>;

export async function getAdminDeliverySettings(): Promise<AdminDeliverySettings> {
  const supabase = await createClient();
  const [{ data: zones, error }, { data: pickups, error: pickupError }] = await Promise.all([
    supabase
      .from("shipping_zones")
      .select("id, name, description, is_active, sort_order, shipping_rates ( id, name, amount, delivery_estimate, is_active )")
      .order("sort_order")
      .order("name"),
    supabase.from("pickup_locations").select("id, name, address, hours, directions, is_active").order("sort_order").order("name"),
  ]);
  if (error) throw error;
  if (pickupError) throw pickupError;

  return {
    groups: (zones ?? []).map((z) => ({
      id: z.id,
      name: z.name,
      description: z.description,
      isActive: z.is_active,
      sortOrder: z.sort_order,
      areas: (z.shipping_rates as { id: string; name: string; amount: number; delivery_estimate: string | null; is_active: boolean }[])
        .map((r) => ({ id: r.id, name: r.name, amount: Number(r.amount), deliveryEstimate: r.delivery_estimate, isActive: r.is_active }))
        .sort((a, b) => a.amount - b.amount || a.name.localeCompare(b.name)),
    })),
    pickups: (pickups ?? []).map((p) => ({ id: p.id, name: p.name, address: p.address, hours: p.hours, directions: p.directions, isActive: p.is_active })),
  };
}

function isForeignKeyViolation(error: { code?: string } | null) {
  return error?.code === "23503";
}

// ---------- Groups

export interface GroupInput {
  name: string;
  description: string;
  isActive: boolean;
}

export async function createGroup(input: GroupInput): Promise<void> {
  const supabase = await createClient();
  const { data: last } = await supabase.from("shipping_zones").select("sort_order").order("sort_order", { ascending: false }).limit(1).maybeSingle();
  const { error } = await supabase
    .from("shipping_zones")
    .insert({ name: input.name, description: input.description || null, is_active: input.isActive, sort_order: (last?.sort_order ?? -1) + 1 });
  if (error?.code === "23505") throw new DeliveryError(`A delivery group called "${input.name}" already exists.`);
  if (error) throw error;
}

export async function updateGroup(id: string, input: GroupInput): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("shipping_zones").update({ name: input.name, description: input.description || null, is_active: input.isActive }).eq("id", id);
  if (error?.code === "23505") throw new DeliveryError(`A delivery group called "${input.name}" already exists.`);
  if (error) throw error;
}

export async function moveGroup(id: string, direction: "up" | "down"): Promise<void> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("shipping_zones").select("id, sort_order").order("sort_order").order("name");
  if (error) throw error;
  const list = [...(data ?? [])];
  const i = list.findIndex((g) => g.id === id);
  const j = direction === "up" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= list.length) return;
  [list[i], list[j]] = [list[j], list[i]];
  for (let k = 0; k < list.length; k++) {
    if (list[k].sort_order !== k) {
      const { error: e } = await supabase.from("shipping_zones").update({ sort_order: k }).eq("id", list[k].id);
      if (e) throw e;
    }
  }
}

/** Returns "hidden" when past orders used one of its areas and it could only be hidden. */
export async function deleteGroup(id: string): Promise<"deleted" | "hidden"> {
  const supabase = await createClient();
  const { error } = await supabase.from("shipping_zones").delete().eq("id", id);
  if (isForeignKeyViolation(error)) {
    await hideGroupAndAreas(supabase, id);
    return "hidden";
  }
  if (error) throw error;
  return "deleted";
}

async function hideGroupAndAreas(supabase: Client, id: string) {
  const { error } = await supabase.from("shipping_zones").update({ is_active: false }).eq("id", id);
  if (error) throw error;
}

// ---------- Areas

export interface AreaInput {
  name: string;
  amount: number;
  deliveryEstimate: string;
  isActive: boolean;
}

function validateArea(input: AreaInput) {
  if (!input.name.trim()) throw new DeliveryError("Enter the area name.");
  if (!Number.isFinite(input.amount) || input.amount < 0) throw new DeliveryError("Enter a delivery price of 0 or more.");
}

export async function createArea(groupId: string, input: AreaInput): Promise<void> {
  validateArea(input);
  const supabase = await createClient();
  const { data: clash } = await supabase.from("shipping_rates").select("id").eq("shipping_zone_id", groupId).ilike("name", input.name.replace(/[\\%_]/g, (c) => `\\${c}`)).limit(1);
  if (clash?.length) throw new DeliveryError(`"${input.name}" is already in this group.`);
  const { error } = await supabase
    .from("shipping_rates")
    .insert({ shipping_zone_id: groupId, name: input.name, amount: input.amount, delivery_estimate: input.deliveryEstimate || null, is_active: input.isActive });
  if (error) throw error;
}

export async function updateArea(id: string, input: AreaInput): Promise<void> {
  validateArea(input);
  const supabase = await createClient();
  const { error } = await supabase
    .from("shipping_rates")
    .update({ name: input.name, amount: input.amount, delivery_estimate: input.deliveryEstimate || null, is_active: input.isActive })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteArea(id: string): Promise<"deleted" | "hidden"> {
  const supabase = await createClient();
  const { error } = await supabase.from("shipping_rates").delete().eq("id", id);
  if (isForeignKeyViolation(error)) {
    const { error: hideError } = await supabase.from("shipping_rates").update({ is_active: false }).eq("id", id);
    if (hideError) throw hideError;
    return "hidden";
  }
  if (error) throw error;
  return "deleted";
}

// ---------- Pickup points

export interface PickupInput {
  name: string;
  address: string;
  hours: string;
  directions: string;
  isActive: boolean;
}

function validatePickup(input: PickupInput) {
  if (!input.name.trim() || !input.address.trim()) throw new DeliveryError("Enter the pickup point's name and address.");
}

export async function createPickup(input: PickupInput): Promise<void> {
  validatePickup(input);
  const supabase = await createClient();
  const { data: last } = await supabase.from("pickup_locations").select("sort_order").order("sort_order", { ascending: false }).limit(1).maybeSingle();
  const { error } = await supabase.from("pickup_locations").insert({
    name: input.name,
    address: input.address,
    hours: input.hours || null,
    directions: input.directions || null,
    is_active: input.isActive,
    sort_order: (last?.sort_order ?? -1) + 1,
  });
  if (error) throw error;
}

export async function updatePickup(id: string, input: PickupInput): Promise<void> {
  validatePickup(input);
  const supabase = await createClient();
  const { error } = await supabase
    .from("pickup_locations")
    .update({ name: input.name, address: input.address, hours: input.hours || null, directions: input.directions || null, is_active: input.isActive })
    .eq("id", id);
  if (error) throw error;
}

export async function deletePickup(id: string): Promise<void> {
  const supabase = await createClient();
  // Orders keep their own snapshot of the pickup point, so nothing references it.
  const { error } = await supabase.from("pickup_locations").delete().eq("id", id);
  if (error) throw error;
}
