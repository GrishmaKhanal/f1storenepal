export type StockedVariant = { stock: number | null };

/** Null stock means untracked/available; zero or negative stock is unavailable. */
export function hasAvailableStock(variants: readonly StockedVariant[]): boolean {
  return variants.some(({ stock }) => stock == null || stock > 0);
}
