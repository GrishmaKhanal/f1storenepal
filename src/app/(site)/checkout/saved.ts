// The customer's details from their last order, kept in this browser only, so a repeat
// order starts filled in. Written after an order succeeds; "Clear" on the checkout
// forgets it (for shared phones and computers), along with the recent orders list.

const KEY = "f1sn-details-v1";
const FIELDS = ["customerName", "phone", "email", "province", "district", "address", "landmark", "mapUrl", "mapAddress"] as const;

export type Saved = Record<(typeof FIELDS)[number], string>;

export function readSaved(): Saved | null {
  if (typeof window === "undefined") return null;
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "null");
    if (!v || typeof v !== "object" || typeof v.phone !== "string") return null;
    return Object.fromEntries(FIELDS.map((k) => [k, typeof v[k] === "string" ? v[k] : ""])) as Saved;
  } catch {
    return null;
  }
}

export function writeSaved(fd: FormData) {
  try {
    localStorage.setItem(KEY, JSON.stringify(Object.fromEntries(FIELDS.map((k) => [k, String(fd.get(k) ?? "")]))));
  } catch {}
}

export function forgetSaved() {
  try {
    localStorage.removeItem(KEY);
    localStorage.removeItem(RECENT);
  } catch {}
}

// Orders placed in this browser, newest first, for one-tap tracking on /track.
const RECENT = "f1sn-orders-v1";
export type Recent = { no: string; token: string; at: number };

/** The stored list as a string: a stable value for useSyncExternalStore to compare. */
export function recentRaw(): string {
  try {
    return localStorage.getItem(RECENT) ?? "";
  } catch {
    return "";
  }
}

export function recentOrders(raw = recentRaw()): Recent[] {
  try {
    const v = JSON.parse(raw || "[]");
    return Array.isArray(v) ? v.filter((r) => r && typeof r.no === "string" && /^[A-Za-z0-9_-]{10,40}$/.test(r.token) && typeof r.at === "number") : [];
  } catch {
    return [];
  }
}

export function rememberOrder(no: string, token: string) {
  try {
    localStorage.setItem(RECENT, JSON.stringify([{ no, token, at: Date.now() }, ...recentOrders().filter((r) => r.token !== token)].slice(0, 5)));
  } catch {}
}
