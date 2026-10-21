"use server";

import { revalidatePath } from "next/cache";
import { requireStaffId } from "@/lib/supabase/staff-auth";
import { changedFields, listNames, logAudit, type AuditFields } from "@/lib/supabase/audit-log";
import { formatKES } from "@/lib/format";
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
  type AdminArea,
  type AdminDeliverySettings,
  type AdminGroup,
  type AdminPickup,
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

// ---------- Audit helpers: what a location / agent / pickup point looked like, in words.

const yesNo = (v: boolean) => (v ? "Yes" : "No");

function groupFields(g: GroupInput | AdminGroup): AuditFields {
  return { Name: g.name, Description: g.description || "None", "Customer types town": yesNo(g.asksCustomerLocation), "Shown at checkout": yesNo(g.isActive) };
}

function areaFields(a: AreaInput | AdminArea): AuditFields {
  return {
    Name: a.name,
    "Agent location": a.agentLocation || "None",
    Fee: formatKES(a.amount),
    Hours: a.hours || "None",
    Estimate: a.deliveryEstimate || "None",
    "Shown at checkout": yesNo(a.isActive),
  };
}

function pickupFields(p: PickupInput | AdminPickup): AuditFields {
  return { Name: p.name, Address: p.address, Hours: p.hours || "None", Directions: p.directions || "None", "Shown at checkout": yesNo(p.isActive) };
}

async function snapshot() {
  return getAdminDeliverySettings().catch(() => null);
}

function findArea(settings: AdminDeliverySettings | null, id: string) {
  for (const g of settings?.groups ?? []) {
    const area = g.areas.find((a) => a.id === id);
    if (area) return { group: g, area };
  }
  return null;
}

/** "Edited agent "Bleu Topaz" in Thika Road — changed Fee" plus just the changed fields. */
function editEntry(what: string, before: AuditFields | null, after: AuditFields) {
  const diff = before ? changedFields(before, after) : null;
  return {
    summary: diff?.names.length ? `Edited ${what} — changed ${listNames(diff.names)}` : `Saved ${what} (no changes)`,
    before: diff?.before,
    after: diff ? diff.after : after,
  };
}

const trimGroup = (g: GroupInput): GroupInput => ({ ...g, name: g.name.trim(), description: g.description.trim() });
const trimArea = (a: AreaInput): AreaInput => ({ ...a, name: a.name.trim(), deliveryEstimate: a.deliveryEstimate.trim(), agentLocation: a.agentLocation.trim(), hours: a.hours.trim() });
const trimPickup = (p: PickupInput): PickupInput => ({ ...p, name: p.name.trim(), address: p.address.trim(), hours: p.hours.trim(), directions: p.directions.trim() });

export async function createGroupAction(input: GroupInput) {
  const g = trimGroup(input);
  if (!g.name) return { ok: false, error: "Enter a group name." } as const;
  return run(async (staffId) => {
    await createGroup(g);
    await logAudit(staffId, "delivery.group_created", "shipping_zone", { label: g.name, summary: `Created delivery location "${g.name}"`, after: groupFields(g) });
  }, "Could not create that delivery group.");
}

export async function updateGroupAction(id: string, input: GroupInput) {
  const g = trimGroup(input);
  if (!g.name) return { ok: false, error: "Enter a group name." } as const;
  return run(async (staffId) => {
    const previous = (await snapshot())?.groups.find((x) => x.id === id) ?? null;
    await updateGroup(id, g);
    await logAudit(staffId, "delivery.group_updated", "shipping_zone", {
      entityId: id,
      label: g.name,
      ...editEntry(`delivery location "${g.name}"`, previous && groupFields(previous), groupFields(g)),
    });
  }, "Could not save that delivery group.");
}

export async function moveGroupAction(id: string, direction: "up" | "down") {
  return run(() => moveGroup(id, direction), "Could not reorder delivery groups.");
}

export async function deleteGroupAction(id: string) {
  return run(async (staffId) => {
    const name = (await snapshot())?.groups.find((x) => x.id === id)?.name ?? "a delivery location";
    const outcome = await deleteGroup(id);
    await logAudit(staffId, outcome === "deleted" ? "delivery.group_deleted" : "delivery.group_hidden", "shipping_zone", {
      entityId: id,
      label: name,
      summary: outcome === "deleted" ? `Deleted delivery location "${name}"` : `Hid delivery location "${name}" (past orders used it, so it couldn't be deleted)`,
    });
    return outcome;
  }, "Could not delete that delivery group.");
}

export async function createAreaAction(groupId: string, input: AreaInput) {
  const a = trimArea(input);
  return run(async (staffId) => {
    const group = (await snapshot())?.groups.find((x) => x.id === groupId);
    await createArea(groupId, a);
    await logAudit(staffId, "delivery.area_created", "shipping_rate", {
      label: a.name,
      summary: `Added "${a.name}" to ${group?.name ?? "a delivery location"} at ${formatKES(a.amount)}`,
      after: areaFields(a),
    });
  }, "Could not add that area.");
}

export async function updateAreaAction(id: string, input: AreaInput) {
  const a = trimArea(input);
  return run(async (staffId) => {
    const found = findArea(await snapshot(), id);
    await updateArea(id, a);
    await logAudit(staffId, "delivery.area_updated", "shipping_rate", {
      entityId: id,
      label: a.name,
      ...editEntry(`"${a.name}"${found ? ` in ${found.group.name}` : ""}`, found && areaFields(found.area), areaFields(a)),
    });
  }, "Could not save that area.");
}

export async function deleteAreaAction(id: string) {
  return run(async (staffId) => {
    const found = findArea(await snapshot(), id);
    const name = found ? `"${found.area.name}" in ${found.group.name}` : "an agent";
    const outcome = await deleteArea(id);
    await logAudit(staffId, outcome === "deleted" ? "delivery.area_deleted" : "delivery.area_hidden", "shipping_rate", {
      entityId: id,
      label: found?.area.name,
      summary: outcome === "deleted" ? `Deleted ${name}` : `Hid ${name} (past orders used it, so it couldn't be deleted)`,
    });
    return outcome;
  }, "Could not delete that area.");
}

export async function createPickupAction(input: PickupInput) {
  const p = trimPickup(input);
  return run(async (staffId) => {
    await createPickup(p);
    await logAudit(staffId, "delivery.pickup_created", "pickup_location", { label: p.name, summary: `Added shop pickup point "${p.name}"`, after: pickupFields(p) });
  }, "Could not add that pickup point.");
}

export async function updatePickupAction(id: string, input: PickupInput) {
  const p = trimPickup(input);
  return run(async (staffId) => {
    const previous = (await snapshot())?.pickups.find((x) => x.id === id) ?? null;
    await updatePickup(id, p);
    await logAudit(staffId, "delivery.pickup_updated", "pickup_location", {
      entityId: id,
      label: p.name,
      ...editEntry(`shop pickup point "${p.name}"`, previous && pickupFields(previous), pickupFields(p)),
    });
  }, "Could not save that pickup point.");
}

export async function deletePickupAction(id: string) {
  return run(async (staffId) => {
    const name = (await snapshot())?.pickups.find((x) => x.id === id)?.name ?? "a pickup point";
    await deletePickup(id);
    await logAudit(staffId, "delivery.pickup_deleted", "pickup_location", { entityId: id, label: name, summary: `Deleted shop pickup point "${name}"` });
  }, "Could not delete that pickup point.");
}
