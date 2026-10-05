import { test } from "node:test";
import assert from "node:assert/strict";
import { deliveryFeeFor, normalizeBag, quote, type PricedVariant } from "../src/lib/pricing";

const v = (o: Partial<PricedVariant> & { variantId: number }): PricedVariant => ({
  productId: o.variantId,
  productName: `P${o.variantId}`,
  productSlug: `p${o.variantId}`,
  variantLabel: null,
  unitPrice: 1000,
  stock: null,
  active: true,
  ...o,
});

test("normalizeBag merges duplicates, drops junk and caps quantity at 10", () => {
  assert.deepEqual(
    normalizeBag([
      { variantId: 1, qty: 2 },
      { variantId: 1, qty: 3 },
      { variantId: 2, qty: 50 },
      { variantId: 3, qty: 0 },
      { variantId: -1, qty: 1 },
      { variantId: 4, qty: 1.7 },
    ]),
    [
      { variantId: 1, qty: 5 },
      { variantId: 2, qty: 10 },
      { variantId: 4, qty: 1 },
    ],
  );
});

test("quote uses server prices, never the client's", () => {
  const q = quote([{ variantId: 1, qty: 2 }], [v({ variantId: 1, unitPrice: 4299 })]);
  assert.equal(q.subtotal, 8598);
  assert.equal(q.total, 8598);
  assert.equal(q.problems.length, 0);
});

test("quote flags sold-out, short stock, unpriced and inactive items", () => {
  const q = quote(
    [
      { variantId: 1, qty: 1 },
      { variantId: 2, qty: 3 },
      { variantId: 3, qty: 1 },
      { variantId: 4, qty: 1 },
      { variantId: 5, qty: 1 },
      { variantId: 6, qty: 4 },
    ],
    [
      v({ variantId: 1, stock: 0 }),
      v({ variantId: 2, stock: 2 }),
      v({ variantId: 3, unitPrice: null }),
      v({ variantId: 4, active: false }),
      // 5 missing entirely (deleted)
      v({ variantId: 6, stock: null, unitPrice: 500 }),
    ],
  );
  assert.deepEqual(
    q.problems.map((p) => [p.variantId, p.reason, p.available]),
    [
      [1, "stock", 0],
      [2, "stock", 2],
      [3, "no-price", undefined],
      [4, "unavailable", undefined],
      [5, "unavailable", undefined],
    ],
  );
  assert.equal(q.subtotal, 2000); // only the untracked item
});

test("delivery fee: zone fee, free over threshold, none for an empty bag", () => {
  const zone = { name: "Jhapa", fee: 100 };
  assert.equal(deliveryFeeFor(3000, zone, null), 100);
  assert.equal(deliveryFeeFor(5000, zone, 5000), 0);
  assert.equal(deliveryFeeFor(4999, zone, 5000), 100);
  assert.equal(deliveryFeeFor(0, zone, null), 0);
  assert.equal(deliveryFeeFor(3000, null, null), 0);
  const q = quote([{ variantId: 1, qty: 1 }], [v({ variantId: 1 })], zone, null);
  assert.equal(q.total, 1100);
});
