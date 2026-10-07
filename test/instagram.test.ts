import { test } from "node:test";
import assert from "node:assert/strict";
import { instagramDmLink } from "../src/lib/instagram";

test("builds a direct message link from the configured handle", () => {
  assert.equal(instagramDmLink("@lightsoutnepal", null), "https://ig.me/m/lightsoutnepal");
});

test("derives a direct message link from a configured Instagram profile", () => {
  assert.equal(instagramDmLink(null, "https://www.instagram.com/lightsoutnepal/"), "https://ig.me/m/lightsoutnepal");
});

test("falls back to the store account when no valid Instagram setting exists", () => {
  assert.equal(instagramDmLink(null, null), "https://ig.me/m/lightsoutnepal");
  assert.equal(instagramDmLink("not a handle", "https://www.instagram.com/lightsoutnepal/"), "https://ig.me/m/lightsoutnepal");
});
