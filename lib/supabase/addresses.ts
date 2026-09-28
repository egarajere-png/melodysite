import { createClient } from "@/lib/supabase/server";

export interface Address {
  id: string;
  label: string;
  recipientName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  region: string | null;
  isDefault: boolean;
}

export interface AddressInput {
  label?: string;
  recipientName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  region?: string;
  isDefault?: boolean;
}

/** RLS ("customer own addresses") restricts every query here to the calling user's
 * own rows, so the normal cookie-based client is sufficient. */

export async function getAddresses(customerId: string): Promise<Address[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customer_addresses")
    .select("id, label, recipient_name, phone, address_line_1, address_line_2, city, region, is_default")
    .eq("customer_id", customerId)
    .order("is_default", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((a) => ({
    id: a.id,
    label: a.label,
    recipientName: a.recipient_name,
    phone: a.phone,
    addressLine1: a.address_line_1,
    addressLine2: a.address_line_2,
    city: a.city,
    region: a.region,
    isDefault: a.is_default,
  }));
}

export async function saveAddress(customerId: string, input: AddressInput): Promise<Address> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customer_addresses")
    .insert({
      customer_id: customerId,
      label: input.label || "Address",
      recipient_name: input.recipientName,
      phone: input.phone,
      address_line_1: input.addressLine1,
      address_line_2: input.addressLine2 || null,
      city: input.city,
      region: input.region || null,
      is_default: input.isDefault ?? false,
    })
    .select("id, label, recipient_name, phone, address_line_1, address_line_2, city, region, is_default")
    .single();
  if (error) throw error;
  return {
    id: data.id,
    label: data.label,
    recipientName: data.recipient_name,
    phone: data.phone,
    addressLine1: data.address_line_1,
    addressLine2: data.address_line_2,
    city: data.city,
    region: data.region,
    isDefault: data.is_default,
  };
}
