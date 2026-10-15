import { test } from "node:test";
import assert from "node:assert/strict";
import { availableFirst, hasAvailableStock } from "../src/lib/product-stock";

test("untracked or positive inventory is not labeled sold out", () => {
  assert.equal(hasAvailableStock([{ stock: null }]), true);
  assert.equal(hasAvailableStock([{ stock: 2 }]), true);
  assert.equal(hasAvailableStock([{ stock: 0 }, { stock: null }]), true);
});

test("inventory is sold out only when every variant has no stock", () => {
  assert.equal(hasAvailableStock([]), false);
  assert.equal(hasAvailableStock([{ stock: 0 }]), false);
  assert.equal(hasAvailableStock([{ stock: 0 }, { stock: 0 }]), false);
});

const item = (id: number, buyable: boolean, inStock: boolean) => ({ id, inStock, variants: [{ available: buyable }] });

test("listings put buy-online products first, then DM-for-price, then sold out", () => {
  const list = [item(1, false, false), item(2, false, true), item(3, true, true), item(4, false, true), item(5, true, true)];
  assert.deepEqual(availableFirst(list).map((p) => p.id), [3, 5, 2, 4, 1]);
});

test("listing order leaves the caller's array untouched", () => {
  const list = [item(1, false, false), item(2, true, true)];
  availableFirst(list);
  assert.deepEqual(list.map((p) => p.id), [1, 2]);
});
