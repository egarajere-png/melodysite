// Pure helper shared by the checkout form (validation) and the server (Daraja request).

/**
 * Normalises a Kenyan mobile number to the 2547XXXXXXXX / 2541XXXXXXXX form Daraja
 * expects. Accepts 07…, 01…, 7…, 254… and +254…; returns null for anything else.
 */
export function toMpesaMsisdn(value: string): string | null {
  const digits = value.replace(/[\s\-()+]/g, "");
  const match = /^(?:254|0)?([17]\d{8})$/.exec(digits);
  return match ? `254${match[1]}` : null;
}
