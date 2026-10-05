import { test } from "node:test";
import assert from "node:assert/strict";
import { SLUG_RE, slugify } from "../src/lib/slug";
import { orderNo, rs } from "../src/lib/money";
import { mediaFile, mediaSrcSet, mediaUrl } from "../src/lib/media-url";

test("slugify handles accents and punctuation", () => {
  assert.equal(slugify("Nico Hülkenberg"), "nico-hulkenberg");
  assert.equal(slugify("Posters & prints"), "posters-prints");
  assert.equal(slugify("Ferrari SF-25 1:43"), "ferrari-sf-25-1-43");
  assert.ok(SLUG_RE.test(slugify("Sergio Pérez")));
});

test("rupees use Indian grouping; order numbers start at F1N-1001", () => {
  assert.equal(rs(5499), "Rs 5,499");
  assert.equal(rs(125000), "Rs 1,25,000");
  assert.equal(orderNo(1), "F1N-1001");
});

test("media URLs pick the largest width not above the limit", () => {
  const m = { storageKey: "products/abc", widths: [480, 960, 1600] };
  assert.equal(mediaFile("products/abc", 480), "products/abc-480.webp");
  assert.equal(mediaUrl(m, 960), "/media/products/abc-960.webp");
  assert.equal(mediaUrl(m), "/media/products/abc-1600.webp");
  assert.equal(mediaUrl({ storageKey: "x", widths: [300] }, 200), "/media/x-300.webp");
  assert.match(mediaSrcSet(m), /abc-480\.webp 480w, .*abc-1600\.webp 1600w$/);
});
