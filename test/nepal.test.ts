import { test } from "node:test";
import assert from "node:assert/strict";
import { districtIn, PROVINCES, provinceOf, zoneFor } from "../src/lib/nepal";
import { defaultSettings } from "../src/content/seed";

test("7 provinces, 77 districts, no duplicates", () => {
  assert.equal(PROVINCES.length, 7);
  const all = PROVINCES.flatMap((p) => p.districts);
  assert.equal(all.length, 77);
  assert.equal(new Set(all).size, 77);
  assert.deepEqual(
    PROVINCES.map((p) => p.districts.length),
    [14, 8, 13, 11, 12, 10, 9],
  );
});

test("finds a district's province, case-insensitively", () => {
  assert.equal(provinceOf("jhapa"), "Koshi");
  assert.equal(provinceOf("Rukum West"), "Karnali");
  assert.equal(provinceOf("Rukum East"), "Lumbini");
  assert.equal(provinceOf("Nawalparasi East"), "Gandaki");
  assert.equal(provinceOf("Mars"), null);
});

test("the store's delivery areas cover every district, most specific first", () => {
  const z = (d: string) => zoneFor(d, defaultSettings.deliveryZones)?.name;
  assert.equal(z("Jhapa"), "Jhapa");
  assert.equal(z("Morang"), "Rest of Koshi Province");
  assert.equal(z("Lalitpur"), "Kathmandu Valley");
  assert.equal(z("Kaski"), "Elsewhere in Nepal");
  assert.equal(z("Mars"), undefined);
  for (const d of PROVINCES.flatMap((p) => p.districts)) assert.ok(z(d), d);
});

test("an area can list several districts or name a province", () => {
  const zones = [
    { name: "Jhapa, Morang & Sunsari", fee: 100 },
    { name: "Gandaki", fee: 200 },
    { name: "Rest of Nepal", fee: 250 },
  ];
  assert.equal(zoneFor("Sunsari", zones)?.fee, 100);
  assert.equal(zoneFor("Kaski", zones)?.fee, 200);
  assert.equal(zoneFor("Kathmandu", zones)?.fee, 250);
  assert.equal(zoneFor("Jhapa", []), null);
});

test("recognises a district in map place names, including other spellings", () => {
  assert.equal(districtIn(["Chobhar", "Kirtipur", "Kathmandu", "Bagmati Province"]), "Kathmandu");
  assert.equal(districtIn([null, "Kaski District"]), "Kaski");
  assert.equal(districtIn(["Kavre"]), "Kavrepalanchok");
  assert.equal(districtIn(["Nawalpur"]), "Nawalparasi East");
  assert.equal(districtIn(["Birtamode", "Nepal"]), null);
});
