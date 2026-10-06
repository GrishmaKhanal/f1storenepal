import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import "dotenv/config";
import pg from "pg";

// Creates a throwaway database next to the local one (.env DATABASE_URL), applies the
// real migrations and starter seed, then exercises checkout and order status changes.
// Skipped when there's no reachable local Postgres. Never touches Neon.
const base = process.env.DATABASE_URL;
const local = !!base && /localhost|127\.0\.0\.1/.test(base);
const name = `test_${randomBytes(4).toString("hex")}`;
const testUrl = base ? base.replace(/\/[^/?]+(\?|$)/, `/${name}$1`) : "";

let reachable = false;
before(async () => {
  if (!local) return;
  const c = new pg.Client({ connectionString: base, connectionTimeoutMillis: 3000 });
  try {
    await c.connect();
    await c.query(`create database ${name}`);
    reachable = true;
  } catch {
    // reachable stays false, tests skip
  } finally {
    await c.end().catch(() => {});
  }
  if (!reachable) return;
  const env = { ...process.env, DATABASE_URL: testUrl, DATABASE_URL_UNPOOLED: "" };
  const r = spawnSync("npx", ["drizzle-kit", "migrate"], { env, encoding: "utf8" });
  assert.equal(r.status, 0, r.stderr);
  // Point the app's db module at the throwaway database before it's first imported.
  process.env.DATABASE_URL = testUrl;
  process.env.S3_BUCKET = "";
  const { seedDatabase } = await import("../src/db/seed");
  const { readFile } = await import("node:fs/promises");
  // Skip the remote manufacturer photos: tests must not depend on the network.
  await seedDatabase((f) => readFile(`public/assets/${f}`), { remoteImages: false });
});

after(async () => {
  if (!reachable) return;
  const { db } = await import("../src/db");
  const { media } = await import("../src/db/schema");
  const { deleteStored } = await import("../src/lib/images");
  for (const m of await db.select().from(media)) await deleteStored(m);
  await (db as unknown as { $client: { end(): Promise<void> } }).$client.end?.();
  const c = new pg.Client(base);
  await c.connect();
  await c.query(`drop database if exists ${name} with (force)`);
  await c.end();
});

const customer = {
  customerName: "Test Customer",
  phone: "9800000000",
  email: null,
  city: "Birtamode",
  address: "Main road",
  note: null,
  deliveryZone: "Jhapa",
  paymentMethod: "cod",
};

async function variantFor(nameLike: string, label: string | null = null) {
  const { db } = await import("../src/db");
  const { products, productVariants } = await import("../src/db/schema");
  const { eq, and, isNull, like } = await import("drizzle-orm");
  const [row] = await db
    .select({ id: productVariants.id, stock: productVariants.stock, price: products.price })
    .from(productVariants)
    .innerJoin(products, eq(products.id, productVariants.productId))
    .where(and(like(products.name, `%${nameLike}%`), label ? eq(productVariants.label, label) : isNull(productVariants.label)));
  return row;
}

test("checkout takes stock, prices from the DB, and refuses to oversell", async (t) => {
  if (!reachable) return t.skip("no local Postgres");
  const { placeOrder, CheckoutError } = await import("../src/lib/orders");
  const { defaultSettings } = await import("../src/content/seed");

  const v = await variantFor("Red Bull RB21"); // seeded with stock 2
  assert.equal(v.stock, 2);
  const order = await placeOrder([{ variantId: v.id, qty: 2 }], customer, defaultSettings);
  assert.ok(order.token.length >= 16);
  assert.equal((await variantFor("Red Bull RB21")).stock, 0);

  const { db } = await import("../src/db");
  const { orders } = await import("../src/db/schema");
  const { eq } = await import("drizzle-orm");
  const [o] = await db.select().from(orders).where(eq(orders.id, order.id));
  assert.equal(o.subtotal, 2 * v.price!);
  const fee = defaultSettings.deliveryZones.find((z) => z.name === customer.deliveryZone)!.fee;
  assert.equal(o.deliveryFee, fee);
  assert.equal(o.total, o.subtotal + fee);

  await assert.rejects(placeOrder([{ variantId: v.id, qty: 1 }], customer, defaultSettings), CheckoutError);
});

test("two customers racing for the last unit: exactly one wins", async (t) => {
  if (!reachable) return t.skip("no local Postgres");
  const { placeOrder } = await import("../src/lib/orders");
  const { defaultSettings } = await import("../src/content/seed");
  const v = await variantFor("Leclerc", "Kids"); // seeded with stock 2
  const results = await Promise.allSettled([1, 2, 3].map(() => placeOrder([{ variantId: v.id, qty: 1 }], customer, defaultSettings)));
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 2);
  assert.equal((await variantFor("Leclerc", "Kids")).stock, 0);
});

test("cancelling returns stock; un-cancelling takes it again", async (t) => {
  if (!reachable) return t.skip("no local Postgres");
  const { placeOrder, setOrderStatus } = await import("../src/lib/orders");
  const { defaultSettings } = await import("../src/content/seed");
  const v = await variantFor("Acrylic display case"); // stock 10
  const o = await placeOrder([{ variantId: v.id, qty: 3 }], customer, defaultSettings);
  assert.equal((await variantFor("Acrylic display case")).stock, 7);
  await setOrderStatus(o.id, "cancelled");
  assert.equal((await variantFor("Acrylic display case")).stock, 10);
  await setOrderStatus(o.id, "cancelled"); // idempotent
  assert.equal((await variantFor("Acrylic display case")).stock, 10);
  await setOrderStatus(o.id, "confirmed");
  assert.equal((await variantFor("Acrylic display case")).stock, 7);
});

test("unknown zone or payment method is rejected before touching stock", async (t) => {
  if (!reachable) return t.skip("no local Postgres");
  const { placeOrder, CheckoutError } = await import("../src/lib/orders");
  const { defaultSettings } = await import("../src/content/seed");
  const v = await variantFor("keychain");
  await assert.rejects(placeOrder([{ variantId: v.id, qty: 1 }], { ...customer, deliveryZone: "Mars" }, defaultSettings), CheckoutError);
  await assert.rejects(placeOrder([{ variantId: v.id, qty: 1 }], { ...customer, paymentMethod: "crypto" }, defaultSettings), CheckoutError);
  assert.equal((await variantFor("keychain")).stock, 12);
});
