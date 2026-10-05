// Pure pricing: no database, no Next. Used by the bag quote, checkout and the tests.
// The browser's prices are never trusted; this runs on the server with fresh rows.

import type { Zone } from "@/db/schema";

export const MAX_QTY = 10;
export const MAX_LINES = 30;

export type BagLine = { variantId: number; qty: number };

export type PricedVariant = {
  variantId: number;
  productId: number;
  productName: string;
  productSlug: string;
  variantLabel: string | null;
  unitPrice: number | null; // null = product has no price
  stock: number | null; // null = not tracked
  active: boolean;
};

export type QuoteLine = {
  variantId: number;
  productId: number;
  productName: string;
  productSlug: string;
  variantLabel: string | null;
  unitPrice: number;
  qty: number;
  lineTotal: number;
};

export type Problem = { variantId: number; name: string; reason: "unavailable" | "no-price" | "stock"; available?: number };

export type Quote = {
  lines: QuoteLine[];
  problems: Problem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
};

/** Merge duplicate variants and clamp quantities. */
export function normalizeBag(lines: BagLine[]): BagLine[] {
  const m = new Map<number, number>();
  for (const l of lines) {
    if (!Number.isInteger(l.variantId) || l.variantId <= 0) continue;
    const q = Math.floor(Number(l.qty));
    if (!Number.isFinite(q) || q <= 0) continue;
    m.set(l.variantId, Math.min(MAX_QTY, (m.get(l.variantId) ?? 0) + q));
  }
  return [...m].slice(0, MAX_LINES).map(([variantId, qty]) => ({ variantId, qty }));
}

export function deliveryFeeFor(subtotal: number, zone: Zone | null, freeOver: number | null): number {
  if (!zone || subtotal === 0) return 0;
  if (freeOver != null && subtotal >= freeOver) return 0;
  return zone.fee;
}

export function quote(
  bag: BagLine[],
  variants: PricedVariant[],
  zone: Zone | null = null,
  freeOver: number | null = null,
): Quote {
  const byId = new Map(variants.map((v) => [v.variantId, v]));
  const lines: QuoteLine[] = [];
  const problems: Problem[] = [];

  for (const { variantId, qty } of normalizeBag(bag)) {
    const v = byId.get(variantId);
    if (!v || !v.active) {
      problems.push({ variantId, name: v?.productName ?? "An item", reason: "unavailable" });
      continue;
    }
    const name = v.variantLabel ? `${v.productName} (${v.variantLabel})` : v.productName;
    if (v.unitPrice == null) {
      problems.push({ variantId, name, reason: "no-price" });
      continue;
    }
    if (v.stock != null && v.stock < qty) {
      problems.push({ variantId, name, reason: "stock", available: Math.max(0, v.stock) });
      continue;
    }
    lines.push({
      variantId,
      productId: v.productId,
      productName: v.productName,
      productSlug: v.productSlug,
      variantLabel: v.variantLabel,
      unitPrice: v.unitPrice,
      qty,
      lineTotal: v.unitPrice * qty,
    });
  }

  const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
  const deliveryFee = deliveryFeeFor(subtotal, zone, freeOver);
  return { lines, problems, subtotal, deliveryFee, total: subtotal + deliveryFee };
}
