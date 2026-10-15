export type StockedVariant = { stock: number | null };

/** Null stock means untracked/available; zero or negative stock is unavailable. */
export function hasAvailableStock(variants: readonly StockedVariant[]): boolean {
  return variants.some(({ stock }) => stock == null || stock > 0);
}

type Listed = { inStock: boolean; variants: readonly { available: boolean }[] };

/** Listing order: buyable online first, then "DM us for price", then sold out. Stable within each group. */
export function availableFirst<T extends Listed>(products: readonly T[]): T[] {
  const rank = (p: T) => (p.variants.some((v) => v.available) ? 0 : p.inStock ? 1 : 2);
  return [...products].sort((a, b) => rank(a) - rank(b));
}
