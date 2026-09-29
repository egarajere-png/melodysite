"use server";

import { revalidatePath } from "next/cache";
import { requireStaffId } from "@/lib/supabase/staff-auth";
import { logAudit } from "@/lib/supabase/audit-log";
import {
  createArea,
  createGroup,
  createPickup,
  deleteArea,
  deleteGroup,
  deletePickup,
  DeliveryError,
  getAdminDeliverySettings,
  moveGroup,
  updateArea,
  updateGroup,
  updatePickup,
  type AdminDeliverySettings,
  type AreaInput,
  type GroupInput,
  type PickupInput,
} from "@/lib/supabase/delivery-admin";

export type DeliveryActionResult = { ok: true; settings: AdminDeliverySettings; outcome?: "deleted" | "hidden" } | { ok: false; error: string };

async function run(work: (staffId: string) => Promise<"deleted" | "hidden" | void>, failure: string): Promise<DeliveryActionResult> {
  const staffId = await requireStaffId();
  if (!staffId) return { ok: false, error: "You don't have permission to manage delivery settings." };
  try {
    const outcome = await work(staffId);
    revalidatePath("/checkout");
    return { ok: true, settings: await getAdminDeliverySettings(), ...(outcome ? { outcome } : {}) };
  } catch (e) {
    return { ok: false, error: e instanceof DeliveryError ? e.message : failure };
  }
}

const trimGroup = (g: GroupInput): GroupInput => ({ ...g, name: g.name.trim(), description: g.description.trim() });
const trimArea = (a: AreaInput): AreaInput => ({ ...a, name: a.name.trim(), deliveryEstimate: a.deliveryEstimate.trim() });
const trimPickup = (p: PickupInput): PickupInput => ({ ...p, name: p.name.trim(), address: p.address.trim(), hours: p.hours.trim(), directions: p.directions.trim() });

export async function createGroupAction(input: GroupInput) {
  const g = trimGroup(input);
  if (!g.name) return { ok: false, error: "Enter a group name." } as const;
  return run(async (staffId) => {
    await createGroup(g);
    await logAudit(staffId, "delivery.group_created", "shipping_zone", undefined, undefined, { name: g.name });
  }, "Could not create that delivery group.");
}

export async function updateGroupAction(id: string, input: GroupInput) {
  const g = trimGroup(input);
  if (!g.name) return { ok: false, error: "Enter a group name." } as const;
  return run(async (staffId) => {
    await updateGroup(id, g);
    await logAudit(staffId, "delivery.group_updated", "shipping_zone", id, undefined, { ...g });
  }, "Could not save that delivery group.");
}

export async function moveGroupAction(id: string, direction: "up" | "down") {
  return run(() => moveGroup(id, direction), "Could not reorder delivery groups.");
}

export async function deleteGroupAction(id: string) {
  return run(async (staffId) => {
    const outcome = await deleteGroup(id);
    await logAudit(staffId, outcome === "deleted" ? "delivery.group_deleted" : "delivery.group_hidden", "shipping_zone", id);
    return outcome;
  }, "Could not delete that delivery group.");
}

export async function createAreaAction(groupId: string, input: AreaInput) {
  const a = trimArea(input);
  return run(async (staffId) => {
    await createArea(groupId, a);
    await logAudit(staffId, "delivery.area_created", "shipping_rate", undefined, undefined, { groupId, name: a.name, amount: a.amount });
  }, "Could not add that area.");
}

export async function updateAreaAction(id: string, input: AreaInput) {
  const a = trimArea(input);
  return run(async (staffId) => {
    await updateArea(id, a);
    await logAudit(staffId, "delivery.area_updated", "shipping_rate", id, undefined, { ...a });
  }, "Could not save that area.");
}

export async function deleteAreaAction(id: string) {
  return run(async (staffId) => {
    const outcome = await deleteArea(id);
    await logAudit(staffId, outcome === "deleted" ? "delivery.area_deleted" : "delivery.area_hidden", "shipping_rate", id);
    return outcome;
  }, "Could not delete that area.");
}

export async function createPickupAction(input: PickupInput) {
  const p = trimPickup(input);
  return run(async (staffId) => {
    await createPickup(p);
    await logAudit(staffId, "delivery.pickup_created", "pickup_location", undefined, undefined, { name: p.name });
  }, "Could not add that pickup point.");
}

export async function updatePickupAction(id: string, input: PickupInput) {
  const p = trimPickup(input);
  return run(async (staffId) => {
    await updatePickup(id, p);
    await logAudit(staffId, "delivery.pickup_updated", "pickup_location", id, undefined, { name: p.name });
  }, "Could not save that pickup point.");
}

export async function deletePickupAction(id: string) {
  return run(async (staffId) => {
    await deletePickup(id);
    await logAudit(staffId, "delivery.pickup_deleted", "pickup_location", id);
  }, "Could not delete that pickup point.");
}
