import { test } from "node:test";
import assert from "node:assert/strict";
import { coordsLink, mapLink } from "../src/lib/map-link";

test("turns coordinates into a Google Maps pin", () => {
  assert.equal(mapLink("26.6646, 87.9873"), "https://www.google.com/maps?q=26.664600,87.987300");
  assert.equal(coordsLink(26.66461234, 87.98731234), "https://www.google.com/maps?q=26.664612,87.987312");
  assert.equal(mapLink("95, 10"), null);
  assert.equal(coordsLink(NaN, 10), null);
});

test("accepts Google Maps share links, with or without share text around them", () => {
  assert.equal(mapLink("https://maps.app.goo.gl/AbC123xyz"), "https://maps.app.goo.gl/AbC123xyz");
  assert.equal(mapLink("Lights Out Nepal\nhttps://maps.app.goo.gl/AbC123xyz"), "https://maps.app.goo.gl/AbC123xyz");
  assert.equal(mapLink("https://goo.gl/maps/AbC123"), "https://goo.gl/maps/AbC123");
  assert.equal(mapLink("https://www.google.com/maps/place/Birtamode/@26.64,87.99,15z"), "https://www.google.com/maps/place/Birtamode/@26.64,87.99,15z");
  assert.equal(mapLink("https://google.com.np/maps?q=26.6,87.9"), "https://google.com.np/maps?q=26.6,87.9");
  assert.equal(mapLink("http://maps.google.com/?q=26.6,87.9"), "https://maps.google.com/?q=26.6,87.9");
});

test("refuses anything that isn't a Google Maps link", () => {
  for (const bad of [
    "",
    "near the bus park",
    "javascript:alert(1)",
    "https://evil.com/maps",
    "https://google.com.evil.com/maps",
    "https://maps.google.com.evil.com/",
    "https://www.google.com/search?q=birtamode",
    "https://goo.gl/AbC123",
  ]) {
    assert.equal(mapLink(bad), null, bad);
  }
});
