import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCartLines, clearCart } from "@/lib/supabase/cart";
import { saveAddress, type AddressInput, type Address } from "@/lib/supabase/addresses";
import { getShippingRates } from "@/lib/supabase/shipping";
import type { CartLine } from "@/context/CartContext";

export interface PersonalizedMessageInput {
  recipientName: string;
  message: string;
}

export interface CreateOrderInput {
  fulfilment: "delivery" | "collection";
  addressId?: string; // an existing saved address
  newAddress?: AddressInput & { saveForFuture?: boolean }; // entered at checkout
  shippingRateId?: string; // required when fulfilment is "delivery"
  personalizedMessage?: PersonalizedMessageInput;
}

export interface CreatedOrder {
  id: string;
  orderNumber: string;
  total: number;
}

function imageReference(line: CartLine): string | null {
  return line.image.url ?? line.image.id ?? null;
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
  const lines = await getCartLines(customerId);
  if (lines.length === 0) throw new Error("Your bag is empty.");

  const supabase = await createClient();
  const reserved: { variantId: string; quantity: number }[] = [];

  try {
    for (const line of lines) {
      const { data: ok, error } = await supabase.rpc("reserve_variant_stock", {
        p_variant_id: line.variantId,
        p_quantity: line.quantity,
      });
      if (error) throw error;
      if (!ok) throw new Error(`"${line.name}" no longer has enough stock. Please update your bag.`);
      reserved.push({ variantId: line.variantId, quantity: line.quantity });
    }

    let shippingAddress: Record<string, string> | null = null;
    let shippingRateId: string | null = null;
    let shippingTotal = 0;

    if (input.fulfilment === "delivery") {
      if (input.newAddress) {
        shippingAddress = {
          recipient_name: input.newAddress.recipientName,
          phone: input.newAddress.phone,
          address_line_1: input.newAddress.addressLine1,
          address_line_2: input.newAddress.addressLine2 ?? "",
          city: input.newAddress.city,
          region: input.newAddress.region ?? "",
        };
        if (input.newAddress.saveForFuture) {
          await saveAddress(customerId, input.newAddress);
        }
      } else if (input.addressId) {
        const { data: addr, error } = await supabase
          .from("customer_addresses")
          .select("recipient_name, phone, address_line_1, address_line_2, city, region")
          .eq("id", input.addressId)
          .eq("customer_id", customerId)
          .single();
        if (error) throw error;
        shippingAddress = addr as unknown as Record<string, string>;
      } else {
        throw new Error("Please add a delivery address.");
      }

      if (!input.shippingRateId) throw new Error("Please choose a delivery option.");
      const rates = await getShippingRates();
      const rate = rates.find((r) => r.id === input.shippingRateId);
      if (!rate) throw new Error("That delivery option is no longer available.");
      shippingRateId = rate.id;
      shippingTotal = rate.amount;
    }

    const subtotal = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
    const total = subtotal + shippingTotal;

    const admin = createAdminClient();
    const { data: order, error: orderErr } = await admin
      .from("orders")
      .insert({
        customer_id: customerId,
        status: "PAYMENT_PENDING",
        fulfilment: input.fulfilment === "delivery" ? "DELIVERY" : "COLLECTION",
        shipping_address: shippingAddress,
        shipping_rate_id: shippingRateId,
        subtotal,
        shipping_total: shippingTotal,
        discount_total: 0,
        total,
        currency: "KES",
      })
      .select("id, order_number, total")
      .single();
    if (orderErr) throw orderErr;

    // unit_cost is snapshotted at order time (like unit_price) so a later cost-price
    // change doesn't retroactively change historical profit — analytics reads this
    // column directly rather than re-deriving it from the current product.
    const { data: costRows } = await admin.from("products").select("id, cost_price").in("id", lines.map((l) => l.productId));
    const costByProductId = new Map((costRows ?? []).map((p) => [p.id, p.cost_price]));

    const { error: itemsErr } = await admin.from("order_items").insert(
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
    );
    if (itemsErr) throw itemsErr;

    const { error: historyErr } = await admin
      .from("order_status_history")
      .insert({ order_id: order.id, status: "PAYMENT_PENDING", note: "Order placed." });
    if (historyErr) throw historyErr;

    if (input.personalizedMessage) {
      const { error: msgErr } = await admin.from("order_personalized_messages").insert({
        order_id: order.id,
        recipient_name: input.personalizedMessage.recipientName,
        message: input.personalizedMessage.message,
      });
      if (msgErr) throw msgErr;
    }

    await clearCart(customerId);

    return { id: order.id, orderNumber: order.order_number, total: Number(order.total) };
  } catch (error) {
    for (const r of reserved) {
      await supabase.rpc("release_variant_stock", { p_variant_id: r.variantId, p_quantity: r.quantity });
    }
    throw error;
  }
}

export type { Address };
