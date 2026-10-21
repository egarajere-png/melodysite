// The site's public address, in one place.

/** https://www.aurumentonet.com in production; NEXT_PUBLIC_SITE_URL overrides it (e.g. http://localhost:3000 while testing). */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.aurumentonet.com").replace(/\/+$/, "");

/** The shop's public contact details and social accounts. */
export const CONTACT = {
  email: "aurumentonet@gmail.com",
  /** Digits only, with country code, for wa.me links. */
  whatsapp: "254720679222",
  whatsappDisplay: "+254 720 679 222",
  instagram: "https://www.instagram.com/aurumentonet/",
  tiktok: "https://www.tiktok.com/@aurumentonet",
  handle: "@aurumentonet",
} as const;

export const WHATSAPP_URL = `https://wa.me/${CONTACT.whatsapp}`;
