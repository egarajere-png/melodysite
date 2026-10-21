// Delivery/pickup details as snapshotted onto an order (orders.shipping_address).
// Pure helpers only — shared by checkout, the admin order page, customer order pages
// and (next phase) order emails, so everyone describes a delivery the same way.

export interface DeliverySnapshot {
  type: "delivery";
  /** Set on every order since delivery moved to Pick Up Mtaani; absent on older door deliveries. */
  courier?: "pickup_mtaani";
  zone: string; // group, e.g. "Thika Road" or "Outside Nairobi"
  area: string; // the Mtaani agent ("Bleu Topaz") or, outside Nairobi, the town ("Nakuru")
  /** Where the parcel is collected: the agent's address, or what the customer typed for a town. */
  location: string;
  /** Present when a Nairobi agent was chosen (rather than a town). */
  agent_location?: string;
  agent_hours?: string;
  address_details?: string; // building, house, street
  instructions?: string;
  recipient_name: string;
  phone: string;
  delivery_estimate?: string;
}

export interface PickupSnapshot {
  type: "pickup";
  pickup_name: string;
  pickup_address: string;
  pickup_hours?: string;
}

/** Orders placed before delivery locations existed. */
interface LegacySnapshot {
  recipient_name?: string;
  phone?: string;
  address_line_1?: string;
  address_line_2?: string;
  city?: string;
  region?: string;
}

export type ShippingSnapshot = DeliverySnapshot | PickupSnapshot | LegacySnapshot;

export interface FulfilmentSummary {
  /** One line, e.g. "Pick Up Mtaani · Thika Road — Bleu Topaz" or "Pickup · Kahawa Sukari Shop". */
  headline: string;
  details: { label: string; value: string }[];
  /** Google Maps search for the drop-off, to double-check the place before dispatch. */
  mapsUrl?: string;
}

/** trackingCode is the Pick Up Mtaani code staff paste in once the parcel is booked. */
export function describeFulfilment(fulfilment: "DELIVERY" | "COLLECTION", raw: unknown, trackingCode?: string | null): FulfilmentSummary {
  const s = (raw ?? {}) as ShippingSnapshot & Record<string, string | undefined>;

  if (s.type === "pickup" || (fulfilment === "COLLECTION" && !s.type)) {
    const p = s as PickupSnapshot;
    return {
      headline: `Pickup · ${p.pickup_name ?? "Shop"}`,
      details: [
        ...(p.pickup_address ? [{ label: "Collect from", value: p.pickup_address }] : []),
        ...(p.pickup_hours ? [{ label: "Hours", value: p.pickup_hours }] : []),
      ],
    };
  }

  if (s.type === "delivery" && s.courier === "pickup_mtaani") {
    const d = s as DeliverySnapshot;
    const isAgent = Boolean(d.agent_location);
    return {
      headline: `Pick Up Mtaani · ${d.zone} — ${d.area}`,
      details: [
        ...(isAgent
          ? [
              { label: "Mtaani agent", value: d.area },
              { label: "Agent location", value: d.location },
              ...(d.agent_hours ? [{ label: "Agent hours", value: d.agent_hours }] : []),
            ]
          : [
              { label: "Town", value: d.area },
              { label: "Collect at", value: d.location },
            ]),
        { label: "Collected by", value: d.recipient_name },
        { label: "Collector's phone", value: d.phone },
        ...(d.delivery_estimate ? [{ label: "Estimate", value: d.delivery_estimate }] : []),
        ...(trackingCode ? [{ label: "Tracking code", value: trackingCode }] : []),
      ],
      mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(isAgent ? `${d.area}, ${d.location}` : `${d.location}, ${d.area}`)}`,
    };
  }

  if (s.type === "delivery") {
    const d = s as DeliverySnapshot;
    const query = [d.location, d.area, d.zone].filter(Boolean).join(", ");
    return {
      headline: `Delivery · ${d.zone} — ${d.area}`,
      details: [
        { label: "Exact location", value: d.location },
        ...(d.address_details ? [{ label: "Building / house", value: d.address_details }] : []),
        ...(d.instructions ? [{ label: "Instructions", value: d.instructions }] : []),
        { label: "Recipient", value: d.recipient_name },
        { label: "Recipient phone", value: d.phone },
        ...(d.delivery_estimate ? [{ label: "Estimate", value: d.delivery_estimate }] : []),
      ],
      mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`,
    };
  }

  const l = s as LegacySnapshot;
  const address = [l.address_line_1, l.address_line_2, l.city, l.region].filter(Boolean).join(", ");
  return {
    headline: fulfilment === "COLLECTION" ? "Pickup" : "Delivery",
    details: [
      ...(address ? [{ label: "Address", value: address }] : []),
      ...(l.recipient_name ? [{ label: "Recipient", value: l.recipient_name }] : []),
      ...(l.phone ? [{ label: "Recipient phone", value: l.phone }] : []),
    ],
    mapsUrl: address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}` : undefined,
  };
}

/** Accepts local (07…, 01…) and international (+254…, +44…) numbers; digits only after an optional +. */
export function isPlausiblePhone(value: string): boolean {
  const compact = value.replace(/[\s-()]/g, "");
  return /^\+?\d{9,15}$/.test(compact);
}

export function isPlausibleEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}
