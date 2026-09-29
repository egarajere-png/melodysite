import { createClient } from "@/lib/supabase/server";

/**
 * Staff management of deals. The storefront runs one deal at a time (getActiveDeal()
 * in lib/supabase/catalogue.ts takes a single active, in-date deal), so activating a
 * deal switches off any other active one — otherwise which deal customers saw would
 * be arbitrary.
 *
 * Dates are picked as calendar days and stored in Nairobi time (EAT, UTC+3): a deal
 * runs from 00:00 on its start date to 23:59:59 on its end date.
 */

const EAT_OFFSET = "+03:00";

export interface AdminDeal {
  id: string;
  title: string;
  discountPercent: number;
  startsAt: string;
  endsAt: string;
  /** YYYY-MM-DD in Nairobi time, for the date inputs. */
  startDate: string;
  endDate: string;
  isActive: boolean;
  productIds: string[];
}

export interface DealInput {
  title: string;
  discountPercent: number;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  productIds: string[];
  isActive: boolean;
}

export class DealError extends Error {}

function toNairobiDate(iso: string): string {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Nairobi" }).format(new Date(iso));
}

function validate(input: DealInput) {
  if (!input.title.trim()) throw new DealError("Enter a deal title.");
  if (!(input.discountPercent > 0 && input.discountPercent <= 90)) throw new DealError("Discount must be between 1% and 90%.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(input.endDate)) throw new DealError("Choose a start and end date.");
  if (input.endDate < input.startDate) throw new DealError("The end date must be on or after the start date.");
  if (input.productIds.length === 0) throw new DealError("Select at least one product for this deal.");
}

function toRow(input: DealInput) {
  return {
    title: input.title.trim(),
    discount_percent: input.discountPercent,
    starts_at: new Date(`${input.startDate}T00:00:00${EAT_OFFSET}`).toISOString(),
    ends_at: new Date(`${input.endDate}T23:59:59${EAT_OFFSET}`).toISOString(),
    is_active: input.isActive,
  };
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
    startDate: toNairobiDate(d.starts_at),
    endDate: toNairobiDate(d.ends_at),
    isActive: d.is_active,
    productIds: (d.deal_products as { product_id: string }[]).map((dp) => dp.product_id),
  }));
}

async function setProducts(supabase: Awaited<ReturnType<typeof createClient>>, dealId: string, productIds: string[]) {
  const { error } = await supabase.from("deal_products").delete().eq("deal_id", dealId);
  if (error) throw error;
  if (productIds.length) {
    const { error: insertError } = await supabase.from("deal_products").insert(productIds.map((product_id) => ({ deal_id: dealId, product_id })));
    if (insertError) throw insertError;
  }
}

/** Switches off every other active deal; returns their titles for the confirmation message. */
async function deactivateOthers(supabase: Awaited<ReturnType<typeof createClient>>, keepId: string): Promise<string[]> {
  const { data, error } = await supabase.from("deals").update({ is_active: false }).eq("is_active", true).neq("id", keepId).select("title");
  if (error) throw error;
  return (data ?? []).map((d) => d.title);
}

export async function createDeal(input: DealInput): Promise<{ id: string; deactivated: string[] }> {
  validate(input);
  const supabase = await createClient();
  const { data: deal, error } = await supabase
    .from("deals")
    .insert({ ...toRow(input), placement: "homepage" })
    .select("id")
    .single();
  if (error) throw error;
  await setProducts(supabase, deal.id, input.productIds);
  const deactivated = input.isActive ? await deactivateOthers(supabase, deal.id) : [];
  return { id: deal.id, deactivated };
}

export async function updateDeal(id: string, input: DealInput): Promise<{ deactivated: string[] }> {
  validate(input);
  const supabase = await createClient();
  const { error } = await supabase.from("deals").update(toRow(input)).eq("id", id);
  if (error) throw error;
  await setProducts(supabase, id, input.productIds);
  return { deactivated: input.isActive ? await deactivateOthers(supabase, id) : [] };
}

export async function setDealActive(id: string, isActive: boolean): Promise<{ deactivated: string[] }> {
  const supabase = await createClient();
  const { error } = await supabase.from("deals").update({ is_active: isActive }).eq("id", id);
  if (error) throw error;
  return { deactivated: isActive ? await deactivateOthers(supabase, id) : [] };
}

export async function deleteDeal(id: string): Promise<void> {
  const supabase = await createClient();
  // deal_products cascades with the deal.
  const { error } = await supabase.from("deals").delete().eq("id", id);
  if (error) throw error;
}
