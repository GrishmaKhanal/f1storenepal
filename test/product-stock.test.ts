import { test } from "node:test";
import assert from "node:assert/strict";
import { hasAvailableStock } from "../src/lib/product-stock";

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
