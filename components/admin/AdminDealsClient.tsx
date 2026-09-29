"use client";

import { useState } from "react";
import { Pencil, Plus, Power, PowerOff, Trash2 } from "lucide-react";
import { createDealAction, deleteDealAction, setDealActiveAction, updateDealAction, type AdminDealActionResult } from "@/app/actions/admin-deals";
import { formatDate } from "@/lib/format";
import type { AdminDeal, DealInput } from "@/lib/supabase/deals-admin";
import { useToast } from "@/components/admin/Toast";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { ProductPicker, type PickableProduct } from "@/components/admin/ProductPicker";

const inputClasses = "w-full border border-aurum-obsidian/15 bg-white px-3 py-2.5 text-sm focus-visible:border-aurum-obsidian focus-visible:outline-none";
const labelClasses = "mb-1.5 block text-xs uppercase tracking-widest text-aurum-obsidian/50";

function todayInNairobi() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Nairobi" }).format(new Date());
}

function emptyForm(): DealInput {
  return { title: "", discountPercent: 15, startDate: todayInNairobi(), endDate: "", productIds: [], isActive: true };
}

type DealStatus = { label: string; className: string };

function statusOf(deal: AdminDeal): DealStatus {
  const now = Date.now();
  if (!deal.isActive) return { label: "Off", className: "bg-aurum-obsidian/10 text-aurum-obsidian/60" };
  if (new Date(deal.endsAt).getTime() < now) return { label: "Ended", className: "bg-aurum-obsidian/10 text-aurum-obsidian/60" };
  if (new Date(deal.startsAt).getTime() > now) return { label: "Scheduled", className: "bg-aurum-gold/15 text-aurum-earth" };
  return { label: "Live", className: "bg-green-700/10 text-green-800" };
}

export function AdminDealsClient({ deals: initial, products }: { deals: AdminDeal[]; products: PickableProduct[] }) {
  const toast = useToast();
  const [deals, setDeals] = useState(initial);
  const [editing, setEditing] = useState<string | null>(null); // null | "new" | deal id
  const [form, setForm] = useState<DealInput>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<AdminDeal | null>(null);

  function apply(result: AdminDealActionResult, success: string) {
    if (!result.ok) {
      toast.error(result.error);
      return false;
    }
    setDeals(result.deals);
    toast.success(success + (result.deactivated.length ? ` ${result.deactivated.join(", ")} was switched off — only one deal runs at a time.` : ""));
    return true;
  }

  function openNew() {
    setEditing("new");
    setForm(emptyForm());
  }

  function openEdit(deal: AdminDeal) {
    setEditing(deal.id);
    setForm({ title: deal.title, discountPercent: deal.discountPercent, startDate: deal.startDate, endDate: deal.endDate, productIds: deal.productIds, isActive: deal.isActive });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const isNew = editing === "new";
    const result = isNew ? await createDealAction(form) : await updateDealAction(editing!, form);
    if (apply(result, isNew ? `${form.title.trim()} deal has been created.` : `${form.title.trim()} deal has been updated.`)) setEditing(null);
    setSaving(false);
  }

  async function toggleActive(deal: AdminDeal) {
    setBusyId(deal.id);
    apply(await setDealActiveAction(deal.id, !deal.isActive), `${deal.title} has been ${deal.isActive ? "deactivated" : "activated"}.`);
    setBusyId(null);
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setBusyId(pendingDelete.id);
    apply(await deleteDealAction(pendingDelete.id, pendingDelete.title), `${pendingDelete.title} deal has been deleted.`);
    if (editing === pendingDelete.id) setEditing(null);
    setBusyId(null);
    setPendingDelete(null);
  }

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">Deals</h1>
          <p className="mt-1 max-w-2xl text-sm text-aurum-obsidian/50">
            One deal runs on the site at a time — it discounts its products and appears on the homepage while it&apos;s active and within its dates.
          </p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 bg-aurum-deep px-5 py-3 text-xs uppercase tracking-widest text-aurum-ivory transition-colors hover:bg-aurum-plum"
        >
          <Plus size={15} strokeWidth={1.5} />
          New Deal
        </button>
      </div>

      {editing && (
        <form onSubmit={handleSave} className="mb-8 flex flex-col gap-5 border border-aurum-obsidian/10 bg-white p-6">
          <h2 className="font-display text-xl">{editing === "new" ? "New deal" : `Edit ${deals.find((d) => d.id === editing)?.title ?? "deal"}`}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="sm:col-span-2">
              <label className={labelClasses}>Title</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required className={inputClasses} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClasses}>Discount (%)</label>
              <input type="number" min={1} max={90} value={form.discountPercent} onChange={(e) => setForm({ ...form, discountPercent: Number(e.target.value) })} required className={inputClasses} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClasses}>Starts</label>
              <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required className={inputClasses} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClasses}>Ends (inclusive)</label>
              <input type="date" value={form.endDate} min={form.startDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} required className={inputClasses} />
            </div>
          </div>
          <label className="flex w-fit cursor-pointer items-center gap-2 text-sm">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="accent-aurum-deep" />
            Active (switches off any other active deal)
          </label>
          <ProductPicker products={products} selected={form.productIds} onChange={(productIds) => setForm({ ...form, productIds })} />
          <div className="flex items-center gap-4">
            <button type="submit" disabled={saving} className="bg-aurum-deep px-6 py-2.5 text-xs uppercase tracking-widest text-aurum-ivory transition-colors hover:bg-aurum-plum disabled:opacity-60">
              {saving ? "Saving…" : editing === "new" ? "Create Deal" : "Save Changes"}
            </button>
            <button type="button" onClick={() => setEditing(null)} className="text-xs uppercase tracking-widest text-aurum-obsidian/60">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="flex flex-col gap-4">
        {deals.length === 0 ? (
          <p className="text-sm text-aurum-obsidian/50">No deals yet.</p>
        ) : (
          deals.map((deal) => {
            const status = statusOf(deal);
            const busy = busyId === deal.id;
            return (
              <div
                key={deal.id}
                className={`flex flex-wrap items-center justify-between gap-4 border bg-white p-5 ${editing === deal.id ? "border-aurum-obsidian" : "border-aurum-obsidian/10"} ${busy ? "opacity-60" : ""}`}
              >
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="font-display text-lg">{deal.title}</h2>
                    <span className={`px-2 py-1 text-[10px] uppercase tracking-wide ${status.className}`}>{status.label}</span>
                  </div>
                  <p className="mt-1 text-xs text-aurum-obsidian/50">
                    {deal.discountPercent}% off · {deal.productIds.length} product{deal.productIds.length === 1 ? "" : "s"} · {formatDate(deal.startsAt)} – {formatDate(deal.endsAt)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => toggleActive(deal)}
                    disabled={Boolean(busyId)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs uppercase tracking-widest transition-colors disabled:opacity-40 ${
                      deal.isActive ? "border border-aurum-obsidian/15 hover:border-aurum-obsidian" : "bg-aurum-deep text-aurum-ivory hover:bg-aurum-plum"
                    }`}
                  >
                    {deal.isActive ? <PowerOff size={13} strokeWidth={1.5} /> : <Power size={13} strokeWidth={1.5} />}
                    {deal.isActive ? "Deactivate" : "Activate"}
                  </button>
                  <button
                    type="button"
                    onClick={() => openEdit(deal)}
                    disabled={Boolean(busyId)}
                    className="flex items-center gap-1.5 border border-aurum-obsidian/15 px-3 py-1.5 text-xs uppercase tracking-widest transition-colors hover:border-aurum-obsidian hover:bg-aurum-obsidian hover:text-aurum-ivory disabled:opacity-40"
                  >
                    <Pencil size={13} strokeWidth={1.5} />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingDelete(deal)}
                    disabled={Boolean(busyId)}
                    className="flex items-center gap-1.5 border border-aurum-earth/30 px-3 py-1.5 text-xs uppercase tracking-widest text-aurum-earth transition-colors hover:bg-aurum-earth hover:text-aurum-ivory disabled:opacity-40"
                  >
                    <Trash2 size={13} strokeWidth={1.5} />
                    Delete
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete deal?"
        message={pendingDelete ? `${pendingDelete.title} will be removed and its products go back to full price. To pause it instead, use Deactivate.` : ""}
        confirmLabel="Delete"
        busy={busyId === pendingDelete?.id}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
