// Browser storage for visitors who haven't signed in: their bag (variant + quantity
// only — prices and stock are always re-read from the server) and wishlist ids.
// Every access is guarded: storage can be unavailable (private mode, blocked cookies).

const CART_KEY = "aurum-guest-cart";
const WISHLIST_KEY = "aurum-guest-wishlist";

export interface StoredCartItem {
  variantId: string;
  quantity: number;
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage unavailable — the bag still works for this page view
  }
}

export const guestCart = {
  read: (): StoredCartItem[] => {
    const items = read<StoredCartItem[]>(CART_KEY, []);
    return Array.isArray(items) ? items.filter((i) => typeof i?.variantId === "string" && Number(i.quantity) > 0) : [];
  },
  write: (items: StoredCartItem[]) => write(CART_KEY, items.length ? items : null),
  clear: () => write(CART_KEY, null),
};

export const guestWishlist = {
  read: (): string[] => {
    const ids = read<string[]>(WISHLIST_KEY, []);
    return Array.isArray(ids) ? ids.filter((id) => typeof id === "string") : [];
  },
  write: (ids: string[]) => write(WISHLIST_KEY, ids.length ? ids : null),
  clear: () => write(WISHLIST_KEY, null),
};
