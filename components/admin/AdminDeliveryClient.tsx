"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Check, Eye, EyeOff, MapPin, Pencil, Plus, Store, Trash2, X } from "lucide-react";
import {
  createAreaAction,
  createGroupAction,
  createPickupAction,
  deleteAreaAction,
  deleteGroupAction,
  deletePickupAction,
  moveGroupAction,
  updateAreaAction,
  updateGroupAction,
  updatePickupAction,
  type DeliveryActionResult,
} from "@/app/actions/admin-delivery";
import type { AdminArea, AdminDeliverySettings, AdminGroup, AdminPickup, AreaInput, GroupInput, PickupInput } from "@/lib/supabase/delivery-admin";
import { formatKES } from "@/lib/format";
import { useToast } from "@/components/admin/Toast";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";

const input = "w-full border border-aurum-obsidian/15 bg-white px-3 py-2 text-sm focus-visible:border-aurum-obsidian focus-visible:outline-none";
const label = "mb-1 block text-[11px] uppercase tracking-widest text-aurum-obsidian/50";
const outlineBtn =
  "flex items-center gap-1.5 border border-aurum-obsidian/15 px-3 py-1.5 text-xs uppercase tracking-widest transition-colors hover:border-aurum-obsidian hover:bg-aurum-obsidian hover:text-aurum-ivory disabled:opacity-40";
const dangerBtn =
  "flex items-center gap-1.5 border border-aurum-earth/30 px-3 py-1.5 text-xs uppercase tracking-widest text-aurum-earth transition-colors hover:bg-aurum-earth hover:text-aurum-ivory disabled:opacity-40";
const primaryBtn = "flex items-center justify-center gap-2 bg-aurum-deep px-5 py-2.5 text-xs uppercase tracking-widest text-aurum-ivory transition-colors hover:bg-aurum-plum disabled:opacity-50";

type Pending =
  | { kind: "group"; group: AdminGroup }
  | { kind: "area"; area: AdminArea; groupName: string }
  | { kind: "pickup"; pickup: AdminPickup };

function priceRange(group: AdminGroup) {
  const prices = group.areas.filter((a) => a.isActive).map((a) => a.amount);
  if (!prices.length) return "No visible areas yet";
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return min === max ? formatKES(min) : `${formatKES(min)} – ${formatKES(max)}`;
}

export function AdminDeliveryClient({ settings: initial }: { settings: AdminDeliverySettings }) {
  const toast = useToast();
  const [settings, setSettings] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [groupForm, setGroupForm] = useState<{ id: string | "new"; data: GroupInput } | null>(null);
  const [pickupForm, setPickupForm] = useState<{ id: string | "new"; data: PickupInput } | null>(null);
  const [pending, setPending] = useState<Pending | null>(null);

  async function act(promise: Promise<DeliveryActionResult | { ok: false; error: string }>, success: string | ((r: DeliveryActionResult & { ok: true }) => string)) {
    setBusy(true);
    const result = await promise;
    setBusy(false);
    if (!result.ok) {
      toast.error(result.error);
      return false;
    }
    setSettings(result.settings);
    toast.success(typeof success === "string" ? success : success(result));
    return true;
  }

  async function saveGroup(e: React.FormEvent) {
    e.preventDefault();
    if (!groupForm) return;
    const isNew = groupForm.id === "new";
    const ok = await act(
      isNew ? createGroupAction(groupForm.data) : updateGroupAction(groupForm.id, groupForm.data),
      isNew ? `${groupForm.data.name.trim()} delivery group has been created. Now add its areas.` : `${groupForm.data.name.trim()} has been updated.`
    );
    if (ok) setGroupForm(null);
  }

  async function savePickup(e: React.FormEvent) {
    e.preventDefault();
    if (!pickupForm) return;
    const isNew = pickupForm.id === "new";
    const ok = await act(
      isNew ? createPickupAction(pickupForm.data) : updatePickupAction(pickupForm.id, pickupForm.data),
      isNew ? `${pickupForm.data.name.trim()} pickup point has been added.` : `${pickupForm.data.name.trim()} has been updated.`
    );
    if (ok) setPickupForm(null);
  }

  async function confirmDelete() {
    if (!pending) return;
    if (pending.kind === "group") {
      await act(deleteGroupAction(pending.group.id), (r) =>
        r.outcome === "hidden"
          ? `${pending.group.name} was used by past orders, so it has been hidden from checkout instead of deleted.`
          : `${pending.group.name} delivery group has been deleted.`
      );
    } else if (pending.kind === "area") {
      await act(deleteAreaAction(pending.area.id), (r) =>
        r.outcome === "hidden" ? `${pending.area.name} was used by past orders, so it has been hidden instead of deleted.` : `${pending.area.name} has been deleted.`
      );
    } else {
      await act(deletePickupAction(pending.pickup.id), `${pending.pickup.name} pickup point has been deleted.`);
    }
    setPending(null);
  }

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">Delivery</h1>
          <p className="mt-1 max-w-2xl text-sm text-aurum-obsidian/50">
            Customers choose a <strong className="font-medium text-aurum-obsidian/70">group</strong>, then an{" "}
            <strong className="font-medium text-aurum-obsidian/70">area</strong> inside it (which sets the delivery fee), then type their exact location. Pickup is always free.
          </p>
        </div>
        <button onClick={() => setGroupForm({ id: "new", data: { name: "", description: "", isActive: true } })} className={primaryBtn}>
          <Plus size={15} strokeWidth={1.5} />
          New Group
        </button>
      </div>

      {groupForm?.id === "new" && <GroupForm form={groupForm.data} busy={busy} onChange={(data) => setGroupForm({ id: "new", data })} onSubmit={saveGroup} onCancel={() => setGroupForm(null)} isNew />}

      <div className="flex flex-col gap-6">
        {settings.groups.length === 0 && <p className="border border-dashed border-aurum-obsidian/20 bg-white p-8 text-center text-sm text-aurum-obsidian/50">No delivery groups yet — create one (e.g. &ldquo;Nairobi&rdquo;) to start.</p>}
        {settings.groups.map((group, index) => (
          <section key={group.id} className={`border bg-white ${group.isActive ? "border-aurum-obsidian/10" : "border-dashed border-aurum-obsidian/20"}`}>
            {groupForm?.id === group.id ? (
              <div className="p-5">
                <GroupForm form={groupForm.data} busy={busy} onChange={(data) => setGroupForm({ id: group.id, data })} onSubmit={saveGroup} onCancel={() => setGroupForm(null)} />
              </div>
            ) : (
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-aurum-obsidian/10 p-5">
                <div className="flex items-start gap-3">
                  <div className="flex flex-col">
                    <button type="button" onClick={() => act(moveGroupAction(group.id, "up"), `${group.name} has been moved up.`)} disabled={busy || index === 0} aria-label={`Move ${group.name} up`} className="p-0.5 text-aurum-obsidian/50 hover:text-aurum-obsidian disabled:opacity-20">
                      <ArrowUp size={15} strokeWidth={1.5} />
                    </button>
                    <button type="button" onClick={() => act(moveGroupAction(group.id, "down"), `${group.name} has been moved down.`)} disabled={busy || index === settings.groups.length - 1} aria-label={`Move ${group.name} down`} className="p-0.5 text-aurum-obsidian/50 hover:text-aurum-obsidian disabled:opacity-20">
                      <ArrowDown size={15} strokeWidth={1.5} />
                    </button>
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="font-display text-xl">{group.name}</h2>
                      {!group.isActive && <span className="bg-aurum-obsidian/10 px-2 py-0.5 text-[10px] uppercase tracking-widest text-aurum-obsidian/60">Hidden</span>}
                    </div>
                    <p className="mt-0.5 text-sm text-aurum-obsidian/60">
                      {priceRange(group)} · {group.areas.length} area{group.areas.length === 1 ? "" : "s"}
                    </p>
                    {group.description && <p className="mt-1 text-sm text-aurum-obsidian/50">{group.description}</p>}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => setGroupForm({ id: group.id, data: { name: group.name, description: group.description ?? "", isActive: group.isActive } })} disabled={busy} className={outlineBtn}>
                    <Pencil size={13} strokeWidth={1.5} /> Edit
                  </button>
                  <button type="button" onClick={() => setPending({ kind: "group", group })} disabled={busy} className={dangerBtn}>
                    <Trash2 size={13} strokeWidth={1.5} /> Delete
                  </button>
                </div>
              </div>
            )}

            <AreasTable group={group} busy={busy} act={act} onDelete={(area) => setPending({ kind: "area", area, groupName: group.name })} />
          </section>
        ))}
      </div>

      {/* Pickup points */}
      <div className="mb-4 mt-12 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl">Pickup points</h2>
          <p className="mt-1 text-sm text-aurum-obsidian/50">Customers who choose pickup pay no delivery fee.</p>
        </div>
        <button onClick={() => setPickupForm({ id: "new", data: { name: "", address: "", hours: "", directions: "", isActive: true } })} className={outlineBtn}>
          <Plus size={13} strokeWidth={1.5} /> Add pickup point
        </button>
      </div>
      {pickupForm?.id === "new" && <PickupForm form={pickupForm.data} busy={busy} onChange={(data) => setPickupForm({ id: "new", data })} onSubmit={savePickup} onCancel={() => setPickupForm(null)} isNew />}
      <div className="grid gap-4 md:grid-cols-2">
        {settings.pickups.map((p) =>
          pickupForm?.id === p.id ? (
            <PickupForm key={p.id} form={pickupForm.data} busy={busy} onChange={(data) => setPickupForm({ id: p.id, data })} onSubmit={savePickup} onCancel={() => setPickupForm(null)} />
          ) : (
            <div key={p.id} className={`flex flex-col border bg-white p-5 ${p.isActive ? "border-aurum-obsidian/10" : "border-dashed border-aurum-obsidian/20"}`}>
              <div className="flex items-start gap-3">
                <Store size={18} strokeWidth={1.5} className="mt-0.5 shrink-0 text-aurum-obsidian/40" />
                <div>
                  <p className="font-display text-lg">
                    {p.name} {!p.isActive && <span className="ml-2 bg-aurum-obsidian/10 px-2 py-0.5 align-middle text-[10px] uppercase tracking-widest text-aurum-obsidian/60">Hidden</span>}
                  </p>
                  <p className="text-sm text-aurum-obsidian/70">{p.address}</p>
                  {p.hours && <p className="mt-1 text-sm text-aurum-obsidian/50">{p.hours}</p>}
                  {p.directions && <p className="mt-1 text-sm text-aurum-obsidian/50">{p.directions}</p>}
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button type="button" onClick={() => setPickupForm({ id: p.id, data: { name: p.name, address: p.address, hours: p.hours ?? "", directions: p.directions ?? "", isActive: p.isActive } })} disabled={busy} className={outlineBtn}>
                  <Pencil size={13} strokeWidth={1.5} /> Edit
                </button>
                <button type="button" onClick={() => setPending({ kind: "pickup", pickup: p })} disabled={busy} className={dangerBtn}>
                  <Trash2 size={13} strokeWidth={1.5} /> Delete
                </button>
              </div>
            </div>
          )
        )}
        {settings.pickups.length === 0 && <p className="text-sm text-aurum-obsidian/50">No pickup points — customers will only see delivery.</p>}
      </div>

      <ConfirmDialog
        open={pending !== null}
        title={pending?.kind === "group" ? "Delete delivery group?" : pending?.kind === "area" ? "Delete area?" : "Delete pickup point?"}
        message={
          pending?.kind === "group"
            ? `${pending.group.name} and its ${pending.group.areas.length} area${pending.group.areas.length === 1 ? "" : "s"} will be removed from checkout. Past orders keep their delivery details.`
            : pending?.kind === "area"
              ? `${pending.area.name} will be removed from ${pending.groupName}. Past orders keep their delivery details.`
              : pending?.kind === "pickup"
                ? `${pending.pickup.name} will no longer be offered at checkout.`
                : ""
        }
        confirmLabel="Delete"
        busy={busy}
        onConfirm={confirmDelete}
        onCancel={() => setPending(null)}
      />
    </div>
  );
}

function GroupForm({ form, busy, onChange, onSubmit, onCancel, isNew = false }: { form: GroupInput; busy: boolean; onChange: (f: GroupInput) => void; onSubmit: (e: React.FormEvent) => void; onCancel: () => void; isNew?: boolean }) {
  return (
    <form onSubmit={onSubmit} className={`grid gap-4 sm:grid-cols-2 ${isNew ? "mb-6 border border-aurum-obsidian/10 bg-white p-5" : ""}`}>
      {isNew && <h2 className="font-display text-xl sm:col-span-2">New delivery group</h2>}
      <div>
        <label className={label}>Group name</label>
        <input value={form.name} onChange={(e) => onChange({ ...form, name: e.target.value })} placeholder="e.g. Nairobi, Kiambu / Kajiado, International" required autoFocus className={input} />
      </div>
      <div>
        <label className={label}>Short description (optional)</label>
        <input value={form.description} onChange={(e) => onChange({ ...form, description: e.target.value })} placeholder="e.g. Within Nairobi county" className={input} />
      </div>
      <label className="flex w-fit cursor-pointer items-center gap-2 text-sm sm:col-span-2">
        <input type="checkbox" checked={form.isActive} onChange={(e) => onChange({ ...form, isActive: e.target.checked })} className="accent-aurum-deep" />
        Show at checkout
      </label>
      <div className="flex items-center gap-4 sm:col-span-2">
        <button type="submit" disabled={busy} className={primaryBtn}>
          {busy ? "Saving…" : isNew ? "Create Group" : "Save Group"}
        </button>
        <button type="button" onClick={onCancel} className="text-xs uppercase tracking-widest text-aurum-obsidian/60">
          Cancel
        </button>
      </div>
    </form>
  );
}

function AreasTable({
  group,
  busy,
  act,
  onDelete,
}: {
  group: AdminGroup;
  busy: boolean;
  act: (p: Promise<DeliveryActionResult>, success: string) => Promise<boolean>;
  onDelete: (area: AdminArea) => void;
}) {
  const [editing, setEditing] = useState<{ id: string; data: AreaInput } | null>(null);
  const [draft, setDraft] = useState<{ name: string; amount: string; deliveryEstimate: string }>({ name: "", amount: "", deliveryEstimate: "" });

  async function addArea(e: React.FormEvent) {
    e.preventDefault();
    const ok = await act(
      createAreaAction(group.id, { name: draft.name, amount: Number(draft.amount), deliveryEstimate: draft.deliveryEstimate, isActive: true }),
      `${draft.name.trim()} (${formatKES(Number(draft.amount))}) has been added to ${group.name}.`
    );
    if (ok) setDraft({ name: "", amount: "", deliveryEstimate: "" });
  }

  async function saveArea(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    if (await act(updateAreaAction(editing.id, editing.data), `${editing.data.name.trim()} has been updated.`)) setEditing(null);
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="text-[11px] uppercase tracking-widest text-aurum-obsidian/45">
            <th className="px-5 py-2.5 font-normal">Area / place</th>
            <th className="px-3 py-2.5 font-normal">Delivery fee</th>
            <th className="px-3 py-2.5 font-normal">Estimate</th>
            <th className="px-3 py-2.5 font-normal">Status</th>
            <th className="px-5 py-2.5 text-right font-normal">Actions</th>
          </tr>
        </thead>
        <tbody>
          {group.areas.map((a) =>
            editing?.id === a.id ? (
              <tr key={a.id} className="border-t border-aurum-obsidian/5 bg-aurum-ivory/50">
                <td className="px-5 py-2">
                  <input value={editing.data.name} onChange={(e) => setEditing({ ...editing, data: { ...editing.data, name: e.target.value } })} className={input} aria-label="Area name" autoFocus />
                </td>
                <td className="px-3 py-2">
                  <input type="number" min={0} value={editing.data.amount} onChange={(e) => setEditing({ ...editing, data: { ...editing.data, amount: Number(e.target.value) } })} className={`${input} w-28`} aria-label="Delivery fee" />
                </td>
                <td className="px-3 py-2">
                  <input value={editing.data.deliveryEstimate} onChange={(e) => setEditing({ ...editing, data: { ...editing.data, deliveryEstimate: e.target.value } })} placeholder="e.g. 1–2 days" className={input} aria-label="Delivery estimate" />
                </td>
                <td className="px-3 py-2 text-xs text-aurum-obsidian/50">{a.isActive ? "Visible" : "Hidden"}</td>
                <td className="px-5 py-2">
                  <form onSubmit={saveArea} className="flex justify-end gap-2">
                    <button type="submit" disabled={busy} className={outlineBtn} aria-label="Save area">
                      <Check size={13} strokeWidth={1.5} /> Save
                    </button>
                    <button type="button" onClick={() => setEditing(null)} className="p-1.5 text-aurum-obsidian/50" aria-label="Cancel editing">
                      <X size={15} strokeWidth={1.5} />
                    </button>
                  </form>
                </td>
              </tr>
            ) : (
              <tr key={a.id} className={`border-t border-aurum-obsidian/5 ${a.isActive ? "" : "text-aurum-obsidian/45"}`}>
                <td className="px-5 py-2.5">
                  <span className="flex items-center gap-2">
                    <MapPin size={13} strokeWidth={1.5} className="shrink-0 text-aurum-obsidian/30" />
                    {a.name}
                  </span>
                </td>
                <td className="px-3 py-2.5 font-medium">{formatKES(a.amount)}</td>
                <td className="px-3 py-2.5 text-aurum-obsidian/60">{a.deliveryEstimate ?? "—"}</td>
                <td className="px-3 py-2.5">
                  <span className={`px-2 py-0.5 text-[10px] uppercase tracking-widest ${a.isActive ? "bg-green-700/10 text-green-800" : "bg-aurum-obsidian/10 text-aurum-obsidian/60"}`}>{a.isActive ? "Visible" : "Hidden"}</span>
                </td>
                <td className="px-5 py-2.5">
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setEditing({ id: a.id, data: { name: a.name, amount: a.amount, deliveryEstimate: a.deliveryEstimate ?? "", isActive: a.isActive } })} disabled={busy} className={outlineBtn}>
                      <Pencil size={13} strokeWidth={1.5} /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => act(updateAreaAction(a.id, { name: a.name, amount: a.amount, deliveryEstimate: a.deliveryEstimate ?? "", isActive: !a.isActive }), a.isActive ? `${a.name} is now hidden from checkout.` : `${a.name} is now shown at checkout.`)}
                      disabled={busy}
                      className={outlineBtn}
                      aria-label={a.isActive ? `Hide ${a.name}` : `Show ${a.name}`}
                    >
                      {a.isActive ? <EyeOff size={13} strokeWidth={1.5} /> : <Eye size={13} strokeWidth={1.5} />}
                    </button>
                    <button type="button" onClick={() => onDelete(a)} disabled={busy} className={dangerBtn} aria-label={`Delete ${a.name}`}>
                      <Trash2 size={13} strokeWidth={1.5} />
                    </button>
                  </div>
                </td>
              </tr>
            )
          )}
          <tr className="border-t border-aurum-obsidian/10 bg-aurum-ivory/40">
            <td className="px-5 py-3">
              <input form={`add-area-${group.id}`} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="New area, e.g. Langata" required className={input} aria-label={`New area name in ${group.name}`} />
            </td>
            <td className="px-3 py-3">
              <input form={`add-area-${group.id}`} type="number" min={0} value={draft.amount} onChange={(e) => setDraft({ ...draft, amount: e.target.value })} placeholder="KSh" required className={`${input} w-28`} aria-label={`New area fee in ${group.name}`} />
            </td>
            <td className="px-3 py-3">
              <input form={`add-area-${group.id}`} value={draft.deliveryEstimate} onChange={(e) => setDraft({ ...draft, deliveryEstimate: e.target.value })} placeholder="Optional, e.g. Same day" className={input} aria-label={`New area estimate in ${group.name}`} />
            </td>
            <td colSpan={2} className="px-5 py-3">
              <form id={`add-area-${group.id}`} onSubmit={addArea} className="flex justify-end">
                <button type="submit" disabled={busy || !draft.name.trim() || draft.amount === ""} className={primaryBtn}>
                  <Plus size={14} strokeWidth={1.5} /> Add Area
                </button>
              </form>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function PickupForm({ form, busy, onChange, onSubmit, onCancel, isNew = false }: { form: PickupInput; busy: boolean; onChange: (f: PickupInput) => void; onSubmit: (e: React.FormEvent) => void; onCancel: () => void; isNew?: boolean }) {
  return (
    <form onSubmit={onSubmit} className={`grid gap-4 border border-aurum-obsidian/10 bg-white p-5 sm:grid-cols-2 ${isNew ? "mb-4" : ""}`}>
      <div>
        <label className={label}>Name</label>
        <input value={form.name} onChange={(e) => onChange({ ...form, name: e.target.value })} placeholder="e.g. Kahawa Sukari Shop" required autoFocus className={input} />
      </div>
      <div>
        <label className={label}>Address</label>
        <input value={form.address} onChange={(e) => onChange({ ...form, address: e.target.value })} placeholder="e.g. Kahawa Sukari, Nairobi" required className={input} />
      </div>
      <div>
        <label className={label}>Hours (optional)</label>
        <input value={form.hours} onChange={(e) => onChange({ ...form, hours: e.target.value })} placeholder="e.g. Mon–Sat, 10am–6pm" className={input} />
      </div>
      <div>
        <label className={label}>Directions (optional)</label>
        <input value={form.directions} onChange={(e) => onChange({ ...form, directions: e.target.value })} placeholder="e.g. Opposite the stage, 1st floor" className={input} />
      </div>
      <label className="flex w-fit cursor-pointer items-center gap-2 text-sm sm:col-span-2">
        <input type="checkbox" checked={form.isActive} onChange={(e) => onChange({ ...form, isActive: e.target.checked })} className="accent-aurum-deep" />
        Offer at checkout
      </label>
      <div className="flex items-center gap-4 sm:col-span-2">
        <button type="submit" disabled={busy} className={primaryBtn}>
          {busy ? "Saving…" : isNew ? "Add Pickup Point" : "Save"}
        </button>
        <button type="button" onClick={onCancel} className="text-xs uppercase tracking-widest text-aurum-obsidian/60">
          Cancel
        </button>
      </div>
    </form>
  );
}
