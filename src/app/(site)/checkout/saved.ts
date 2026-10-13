// The customer's details from their last order, kept in this browser only, so a repeat
// order starts filled in. Written after an order succeeds; "Clear" on the checkout
// forgets it (for shared phones and computers).

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
  } catch {}
}
