// Prices are whole rupees. Indian digit grouping matches how Nepal writes amounts.
export const rs = (n: number) => `Rs ${n.toLocaleString("en-IN")}`;

export const orderNo = (id: number) => `F1N-${1000 + id}`;

/** "F1N-1027", "f1n 1027", "#1027" or "1027" → 27. Null for anything else. */
export function orderIdFrom(ref: string): number | null {
  const m = ref.trim().match(/^#?\s*(?:f1n)?[\s-]*(\d{4,9})$/i);
  const id = m ? Number(m[1]) - 1000 : 0;
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

/** Same number however it's written: spaces, dashes, +977 or 977 in front. */
export function samePhone(a: string, b: string): boolean {
  const n = (s: string) => s.replace(/\D/g, "").replace(/^977(?=\d{7,10}$)/, "");
  return n(a).length >= 7 && n(a) === n(b);
}
