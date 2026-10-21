import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCartLines, clearCart } from "@/lib/supabase/cart";
import { isPlausibleEmail, isPlausiblePhone, type DeliverySnapshot, type PickupSnapshot } from "@/lib/delivery";
import type { CartLine } from "@/context/CartContext";
import type { Json } from "@/lib/supabase/database.types";

export interface PersonalizedMessageInput {
  recipientName: string;
  message: string;
}

export interface DeliveryDetailsInput {
  areaId: string; // shipping_rates.id — the Mtaani agent or town; sets the fee
  /** Only for a town outside Nairobi: where in that town they want to collect. */
  location?: string;
  recipientName: string;
  recipientPhone: string;
}

export interface CreateOrderInput {
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  fulfilment: "delivery" | "collection";
  delivery?: DeliveryDetailsInput; // required when fulfilment is "delivery"
  pickupLocationId?: string; // required when fulfilment is "collection"
  personalizedMessage?: PersonalizedMessageInput;
}

/** Customer-facing validation error: its message is safe to show as-is. */
export class CheckoutError extends Error {}

function clean(value: string | undefined, max = 300): string {
  return (value ?? "").trim().slice(0, max);
}

/**
 * Resolves the buyer's choice against the live delivery settings. The fee, group and
 * area names always come from the database — never from what the browser sent.
 */
async function resolveFulfilment(input: CreateOrderInput): Promise<{
  snapshot: DeliverySnapshot | PickupSnapshot;
  shippingRateId: string | null;
  shippingTotal: number;
}> {
  const supabase = await createClient();

  if (input.fulfilment === "collection") {
    const { data: pickup } = await supabase
      .from("pickup_locations")
      .select("name, address, hours")
      .eq("id", input.pickupLocationId ?? "")
      .eq("is_active", true)
      .maybeSingle();
    if (!pickup) throw new CheckoutError("Please choose a pickup point.");
    return {
      snapshot: { type: "pickup", pickup_name: pickup.name, pickup_address: pickup.address, ...(pickup.hours ? { pickup_hours: pickup.hours } : {}) },
      shippingRateId: null,
      shippingTotal: 0,
    };
  }

  const d = input.delivery;
  if (!d?.areaId) throw new CheckoutError("Please choose a Pick Up Mtaani agent.");
  const recipientName = clean(d.recipientName, 120);
  const recipientPhone = clean(d.recipientPhone, 30);
  if (!recipientName) throw new CheckoutError("Please enter the name of the person collecting.");
  if (!isPlausiblePhone(recipientPhone)) throw new CheckoutError("Please enter a valid phone number for the person collecting.");

  const { data: area } = await supabase
    .from("shipping_rates")
    .select("id, name, amount, delivery_estimate, agent_location, hours, is_active, shipping_zones ( name, is_active, asks_customer_location )")
    .eq("id", d.areaId)
    .maybeSingle();
  const zone = area?.shipping_zones as unknown as { name: string; is_active: boolean; asks_customer_location: boolean } | null;
  if (!area || !area.is_active || !zone?.is_active) throw new CheckoutError("That Pick Up Mtaani agent is no longer available. Please choose another.");

  // A Nairobi agent is the collection point; for a town the customer says where.
  const typedLocation = clean(d.location);
  if ((zone.asks_customer_location || !area.agent_location) && !typedLocation) {
    throw new CheckoutError(`Please tell us where in ${area.name} you'd like to collect your order.`);
  }
  const location = area.agent_location && !zone.asks_customer_location ? area.agent_location : typedLocation;

  return {
    snapshot: {
      type: "delivery",
      courier: "pickup_mtaani",
      zone: zone.name,
      area: area.name,
      location,
      ...(area.agent_location && !zone.asks_customer_location ? { agent_location: area.agent_location } : {}),
      ...(area.hours ? { agent_hours: area.hours } : {}),
      recipient_name: recipientName,
      phone: recipientPhone,
      ...(area.delivery_estimate ? { delivery_estimate: area.delivery_estimate } : {}),
    },
    shippingRateId: area.id,
    shippingTotal: Number(area.amount),
  };
}

export interface CheckoutPrefill {
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  fulfilment: "delivery" | "collection" | null;
  areaId: string | null;
  delivery: Partial<DeliverySnapshot> | null;
}

/** Details from the customer's most recent order, so returning buyers don't retype them. */
export async function getCheckoutPrefill(customerId: string): Promise<CheckoutPrefill> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select("contact_name, contact_email, contact_phone, fulfilment, shipping_rate_id, shipping_address")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const snapshot = data?.shipping_address as Partial<DeliverySnapshot> | null;
  return {
    contactName: data?.contact_name ?? null,
    contactEmail: data?.contact_email ?? null,
    contactPhone: data?.contact_phone ?? null,
    fulfilment: data ? (data.fulfilment === "COLLECTION" ? "collection" : "delivery") : null,
    areaId: data?.shipping_rate_id ?? null,
    delivery: snapshot?.type === "delivery" ? snapshot : null,
  };
}

export interface CreatedOrder {
  id: string;
  orderNumber: string;
  total: number;
  /** Lets a guest open their order page: /orders/<number>?t=<accessToken>. */
  accessToken: string;
}

/** Snapshot of the line's image URL for order history; null when the product had no photo yet. */
function imageReference(line: CartLine): string | null {
  return line.image.url ?? null;
}

/**
 * Creates an order from the customer's current server-side cart — never from
 * anything the client submits directly. Price and stock come from getCartLines(),
 * which re-derives both live on every call (see lib/supabase/cart.ts). Stock is
 * reserved atomically per line via the reserve_variant_stock() DB function before
 * any order row is written, and released again if a later step fails, so a failed
 * checkout never leaves phantom stock holds behind.
 *
 * There's no client-facing INSERT policy on orders/order_items (by design — see the
 * migration), so the actual writes go through the service-role client. The
 * authenticated, RLS-respecting client is still used for reserving stock and saving
 * addresses, since those are the customer's own rows.
 */
export async function createOrder(customerId: string, input: CreateOrderInput): Promise<CreatedOrder> {
  const contactName = clean(input.contactName, 120);
  if (!contactName) throw new CheckoutError("Please enter your full name.");
  const contactEmail = clean(input.contactEmail, 200);
  const contactPhone = clean(input.contactPhone, 30);
  if (!isPlausibleEmail(contactEmail)) throw new CheckoutError("Please enter a valid email address — we'll send your order updates there.");
  if (!isPlausiblePhone(contactPhone)) throw new CheckoutError("Please enter a valid phone number.");

  // The bag and the delivery choice don't depend on each other — load both at once.
  const [lines, { snapshot, shippingRateId, shippingTotal }] = await Promise.all([getCartLines(customerId), resolveFulfilment(input)]);
  if (lines.length === 0) throw new CheckoutError("Your bag is empty, or its pieces have just sold out.");

  // Stock is reserved with the service-role client; this only ever runs server-side,
  // after the checks above.
  const stockClient = createAdminClient();
  const reserved: { variantId: string; quantity: number }[] = [];

  try {
    // Every line is reserved at once; whatever did get reserved is released below if
    // any line fails.
    const attempts = await Promise.all(
      lines.map(async (line) => {
        const { data: ok, error } = await stockClient.rpc("reserve_variant_stock", { p_variant_id: line.variantId, p_quantity: line.quantity });
        if (ok && !error) reserved.push({ variantId: line.variantId, quantity: line.quantity });
        return { line, ok: Boolean(ok), error };
      })
    );
    const failed = attempts.find((a) => a.error || !a.ok);
    if (failed?.error) throw failed.error;
    if (failed) throw new CheckoutError(`"${failed.line.name}" no longer has enough stock. Please update your bag.`);

    const subtotal = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
    const total = subtotal + shippingTotal;

    const admin = createAdminClient();
    // unit_cost is snapshotted at order time (like unit_price) so a later cost-price
    // change doesn't retroactively change historical profit — analytics reads this
    // column directly rather than re-deriving it from the current product.
    const [{ data: order, error: orderErr }, { data: costRows }] = await Promise.all([
      admin
        .from("orders")
        .insert({
          customer_id: customerId,
          status: "PAYMENT_PENDING",
          fulfilment: input.fulfilment === "delivery" ? "DELIVERY" : "COLLECTION",
          shipping_address: snapshot as unknown as Json,
          shipping_rate_id: shippingRateId,
          contact_name: contactName,
          contact_email: contactEmail,
          contact_phone: contactPhone,
          subtotal,
          shipping_total: shippingTotal,
          discount_total: 0,
          total,
          currency: "KES",
        })
        .select("id, order_number, total, access_token")
        .single(),
      admin.from("products").select("id, cost_price").in("id", lines.map((l) => l.productId)),
    ]);
    if (orderErr) throw orderErr;
    const costByProductId = new Map((costRows ?? []).map((p) => [p.id, p.cost_price]));

    // The order's own rows are independent of each other, so they're written together.
    const [{ error: itemsErr }, { error: historyErr }, { error: msgErr }] = await Promise.all([
      admin.from("order_items").insert(
        lines.map((l) => ({
          order_id: order.id,
          product_id: l.productId,
          variant_id: l.variantId,
          product_name: l.name,
          variant_name: l.variantLabel,
          sku: l.sku,
          quantity: l.quantity,
          unit_price: l.unitPrice,
          unit_cost: costByProductId.get(l.productId) ?? null,
          image_path: imageReference(l),
        }))
      ),
      admin.from("order_status_history").insert({ order_id: order.id, status: "PAYMENT_PENDING", note: "Order placed." }),
      input.personalizedMessage
        ? admin.from("order_personalized_messages").insert({
            order_id: order.id,
            recipient_name: input.personalizedMessage.recipientName,
            message: input.personalizedMessage.message,
          })
        : Promise.resolve({ error: null }),
    ]);
    if (itemsErr) throw itemsErr;
    if (historyErr) throw historyErr;
    if (msgErr) throw msgErr;

    await clearCart(customerId);

    return { id: order.id, orderNumber: order.order_number, total: Number(order.total), accessToken: order.access_token };
  } catch (error) {
    for (const r of reserved) {
      await stockClient.rpc("release_variant_stock", { p_variant_id: r.variantId, p_quantity: r.quantity });
    }
    throw error;
  }
}

