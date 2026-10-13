import { test } from "node:test";
import assert from "node:assert/strict";
import { orderIdFrom, orderNo, samePhone } from "../src/lib/money";

test("reads an order number however the customer types it", () => {
  for (const ref of ["F1N-1027", "f1n-1027", "F1N 1027", "f1n1027", "#1027", "1027", "  F1N-1027 "]) assert.equal(orderIdFrom(ref), 27, ref);
  assert.equal(orderIdFrom(orderNo(5)), 5);
  for (const bad of ["", "F1N-", "1000", "999", "F1N-abc", "1027; drop table", "F2N-1027"]) assert.equal(orderIdFrom(bad), null, bad);
});

test("matches a phone number with or without spaces and the country code", () => {
  assert.ok(samePhone("9800000000", "980-000-0000"));
  assert.ok(samePhone("9800000000", "+977 9800000000"));
  assert.ok(samePhone("+9779800000000", "9800000000"));
  assert.equal(samePhone("9800000000", "9800000001"), false);
  assert.equal(samePhone("9800000000", "0000"), false);
  assert.equal(samePhone("", ""), false);
});
