"use server";

import { and, eq, inArray } from "drizzle-orm";
import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db, hasDb } from "@/db";
import { seedDatabase } from "@/db/seed";
import {
  categories,
  drivers,
  media,
  orders,
  products,
  productImages,
  productVariants,
  settings,
  teams,
  type OrderStatus,
  type SiteSettings,
} from "@/db/schema";
import { defaultSettings } from "@/content/seed";
import { TAGS } from "@/lib/data";
import { checkCredentials, createSession, destroySession, requireAdmin } from "@/lib/auth";
import { ADMIN } from "@/lib/admin-path";
import { deleteStored, processAndStore, UploadError } from "@/lib/images";
import { canWrite } from "@/lib/media-store";
import { mediaUrl } from "@/lib/media-url";
import { setOrderStatus } from "@/lib/orders";
import { SITE_URL } from "@/lib/site";
import { SLUG_RE, slugify } from "@/lib/slug";

export type FormState = { error?: string; ok?: string } | undefined;

function assertDb() {
  if (!hasDb) throw new Error("DATABASE_URL is not configured.");
}

// Drizzle wraps driver errors ("Failed query: ..."), so the Postgres code sits on `cause`.
const pgCode = (e: unknown) =>
  (e as { code?: string } | null)?.code ?? (e as { cause?: { code?: string } } | null)?.cause?.code;

function saveFailed(e: unknown): FormState {
  console.error(e);
  return { error: "Couldn't save. Your changes are still here, try again." };
}

const expire = (...tags: (keyof typeof TAGS)[]) => tags.forEach((t) => updateTag(TAGS[t]));
const expireAll = () => expire("settings", "catalog", "products");

/* ---------- form helpers ---------- */

const text = (fd: FormData, k: string) => String(fd.get(k) ?? "").replace(/\r\n?/g, "\n");
const str = (fd: FormData, k: string) => text(fd, k).trim();
const opt = (fd: FormData, k: string) => str(fd, k) || null;
const bool = (fd: FormData, k: string) => fd.get(k) === "on";
/** Whole number or null for an empty field. Throws on junk so it can't silently save 0. */
function int(fd: FormData, k: string, label: string): number | null {
  const v = str(fd, k).replace(/[, ]/g, "");
  if (!v) return null;
  const n = Number(v);
  if (!Number.isInteger(n) || n < 0) throw new InputError(`${label} must be a whole number (0 or more).`);
  return n;
}
const lines = (fd: FormData, k: string) =>
  text(fd, k)
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
const idOf = (fd: FormData) => Number(fd.get("id")) || null;

class InputError extends Error {}

const Slugged = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().regex(SLUG_RE, "Slug: lowercase letters, numbers and dashes only"),
});

function slugged(fd: FormData) {
  const r = Slugged.safeParse({ name: str(fd, "name"), slug: str(fd, "slug") || slugify(str(fd, "name")) });
  if (!r.success) throw new InputError(r.error.issues[0].message);
  return r.data;
}

/** Runs a save; turns input errors and duplicate slugs into form messages. */
async function attempt(fn: () => Promise<FormState | void>): Promise<FormState> {
  try {
    await requireAdmin();
    assertDb();
    return (await fn()) ?? { ok: "Saved." };
  } catch (e) {
    if (e instanceof InputError) return { error: e.message };
    if (pgCode(e) === "23505") return { error: "That slug is already used. Pick another." };
    // redirect() works by throwing; let it through.
    if ((e as { digest?: string })?.digest?.startsWith("NEXT_REDIRECT")) throw e;
    return saveFailed(e);
  }
}

/* ---------- auth ---------- */

export async function login(_: FormState, fd: FormData): Promise<FormState> {
  if (!checkCredentials(str(fd, "username"), String(fd.get("password") ?? ""))) {
    await new Promise((r) => setTimeout(r, 800)); // slow down guessing
    return { error: "Wrong username or password." };
  }
  await createSession();
  redirect(ADMIN);
}

export async function logout() {
  await destroySession();
  redirect(ADMIN);
}

/* ---------- media ---------- */

export type Uploaded = { id: number; src: string; alt: string; name: string };

export async function uploadImage(fd: FormData): Promise<{ media?: Uploaded; error?: string }> {
  await requireAdmin();
  if (!hasDb) return { error: "No database connected (DATABASE_URL missing)." };
  const blocked = canWrite();
  if (blocked) return { error: blocked };
  const file = fd.get("file");
  if (!(file instanceof File) || !file.size) return { error: "No file." };
  const name = (str(fd, "name") || file.name.replace(/\.[a-z0-9]+$/i, "")).slice(0, 200);
  const alt = (str(fd, "alt") || name.replace(/[-_]+/g, " ")).slice(0, 300);
  let stored;
  try {
    stored = await processAndStore(Buffer.from(await file.arrayBuffer()), str(fd, "folder") === "products" ? "products" : "media");
  } catch (e) {
    if (e instanceof UploadError) return { error: e.message };
    console.error(e);
    return { error: "Upload failed. Check the image storage settings and try again." };
  }
  try {
    const [row] = await db.insert(media).values({ ...stored, name, alt }).returning();
    return { media: { id: row.id, src: mediaUrl(row, 480), alt: row.alt, name: row.name } };
  } catch (e) {
    // Don't leave orphaned files in the bucket.
    await deleteStored(stored).catch(() => {});
    console.error(e);
    return { error: "Upload failed, try again." };
  }
}

export async function saveMedia(_: FormState, fd: FormData): Promise<FormState> {
  return attempt(async () => {
    const id = idOf(fd);
    if (!id) throw new InputError("Missing image.");
    const alt = str(fd, "alt");
    if (!alt) throw new InputError("Alt text is required: it describes the image to search engines and screen readers.");
    await db.update(media).set({ name: str(fd, "name") || alt, alt }).where(eq(media.id, id));
    expireAll();
  });
}

/** Where an image is used, so deletes never leave holes on the site. */
async function mediaUsage(id: number) {
  const [ps, ts, ds, [srow]] = await Promise.all([
    db.select({ name: products.name }).from(productImages).innerJoin(products, eq(products.id, productImages.productId)).where(eq(productImages.mediaId, id)),
    db.select({ name: teams.name }).from(teams).where(eq(teams.logoId, id)),
    db.select({ name: drivers.name }).from(drivers).where(eq(drivers.portraitId, id)),
    db.select().from(settings).where(eq(settings.key, "site")),
  ]);
  const uses = [...ps.map((p) => `product “${p.name}”`), ...ts.map((t) => `team “${t.name}”`), ...ds.map((d) => `driver “${d.name}”`)];
  if (srow?.value.heroImageId === id) uses.push("the home page hero");
  return uses;
}

export async function deleteMedia(fd: FormData) {
  await requireAdmin();
  assertDb();
  const id = idOf(fd);
  if (!id) return;
  const uses = await mediaUsage(id);
  if (uses.length) redirect(`${ADMIN}/media?inuse=${encodeURIComponent(uses.slice(0, 3).join(", "))}`);
  const [row] = await db.select().from(media).where(eq(media.id, id));
  if (!row) return;
  try {
    await deleteStored(row);
  } catch (e) {
    console.error(e);
    redirect(`${ADMIN}/media?failed=1`);
  }
  await db.delete(media).where(eq(media.id, id));
  redirect(`${ADMIN}/media`);
}

/* ---------- products ---------- */

const VariantIn = z.object({
  id: z.number().int().positive().nullable(),
  label: z.string().trim().max(80).nullable(),
  sku: z.string().trim().max(80).nullable(),
  price: z.number().int().nonnegative().nullable(),
  stock: z.number().int().nullable(),
});

function parseJson<T>(fd: FormData, key: string, schema: z.ZodType<T>, what: string): T {
  try {
    const r = schema.safeParse(JSON.parse(String(fd.get(key) ?? "[]")));
    if (!r.success) throw new InputError(`${what}: ${r.error.issues[0].message}`);
    return r.data;
  } catch (e) {
    if (e instanceof InputError) throw e;
    throw new InputError(`${what} couldn't be read.`);
  }
}

export async function saveProduct(_: FormState, fd: FormData): Promise<FormState> {
  const id = idOf(fd);
  let savedId = id;
  const res = await attempt(async () => {
    const { name, slug } = slugged(fd);
    const status = z.enum(["draft", "active", "archived"]).parse(str(fd, "status") || "draft");
    const variants = parseJson(fd, "variants", z.array(VariantIn).min(1, "add at least one variant").max(60), "Variants");
    const imageIds = parseJson(fd, "images", z.array(z.number().int().positive()).max(20), "Images");
    const labelled = variants.filter((v) => v.label);
    if (variants.length > 1 && labelled.length !== variants.length) throw new InputError("When a product has several variants, give each one a label (e.g. S, M, L).");
    if (new Set(labelled.map((v) => v.label!.toLowerCase())).size !== labelled.length) throw new InputError("Two variants have the same label.");

    const ref = (k: string) => Number(fd.get(k)) || null;
    const values = {
      name,
      slug,
      status,
      description: opt(fd, "description"),
      teamId: ref("teamId"),
      driverId: ref("driverId"),
      categoryId: ref("categoryId"),
      brand: opt(fd, "brand"),
      scale: opt(fd, "scale"),
      price: int(fd, "price", "Price"),
      compareAtPrice: int(fd, "compareAtPrice", "Compare-at price"),
      badge: opt(fd, "badge"),
      sortOrder: int(fd, "sortOrder", "Sort order") ?? 0,
      seoTitle: opt(fd, "seoTitle"),
      seoDescription: opt(fd, "seoDescription"),
      updatedAt: new Date(),
    };
    if (values.price == null && variants.some((v) => v.price == null) && status === "active") {
      // Allowed (shows "Ask on Instagram"), just make it deliberate.
      if (fd.get("allowNoPrice") !== "on") throw new InputError("Set a price, or tick “No price: ask on Instagram”.");
    }

    if (id) {
      const [prev] = await db.select({ publishedAt: products.publishedAt }).from(products).where(eq(products.id, id));
      await db
        .update(products)
        .set({ ...values, publishedAt: prev?.publishedAt ?? (status === "active" ? new Date() : null) })
        .where(eq(products.id, id));
    } else {
      const [row] = await db
        .insert(products)
        .values({ ...values, publishedAt: status === "active" ? new Date() : null })
        .returning({ id: products.id });
      savedId = row.id;
    }
    const pid = savedId!;

    // Variants: update kept rows, insert new ones, delete removed ones. Order history
    // keeps its snapshot (order_items.variant_id is set null on delete).
    const existing = await db.select({ id: productVariants.id }).from(productVariants).where(eq(productVariants.productId, pid));
    const keep = new Set(variants.map((v) => v.id).filter(Boolean));
    const gone = existing.map((e) => e.id).filter((x) => !keep.has(x));
    if (gone.length) await db.delete(productVariants).where(and(eq(productVariants.productId, pid), inArray(productVariants.id, gone)));
    for (const [i, v] of variants.entries()) {
      const row = { label: v.label || null, sku: v.sku || null, price: v.price, stock: v.stock, sortOrder: i };
      if (v.id && existing.some((e) => e.id === v.id)) {
        await db.update(productVariants).set(row).where(and(eq(productVariants.id, v.id), eq(productVariants.productId, pid)));
      } else {
        await db.insert(productVariants).values({ ...row, productId: pid });
      }
    }

    await db.delete(productImages).where(eq(productImages.productId, pid));
    if (imageIds.length) {
      await db.insert(productImages).values([...new Set(imageIds)].map((mediaId, i) => ({ productId: pid, mediaId, sortOrder: i })));
    }
    expire("products", "settings");
  });
  if (res?.ok && !id && savedId) redirect(`${ADMIN}/products/${savedId}?created=1`);
  return res;
}

export async function deleteProduct(fd: FormData) {
  await requireAdmin();
  assertDb();
  await db.delete(products).where(eq(products.id, Number(fd.get("id"))));
  expire("products", "settings");
  redirect(`${ADMIN}/products`);
}

/** Quick stock edit from the products list. */
export async function setStock(fd: FormData) {
  await requireAdmin();
  assertDb();
  const id = Number(fd.get("variantId"));
  const raw = String(fd.get("stock") ?? "").trim();
  const stock = raw === "" ? null : Math.max(0, Math.floor(Number(raw)));
  if (!id || (stock != null && !Number.isFinite(stock))) return;
  await db.update(productVariants).set({ stock }).where(eq(productVariants.id, id));
  expire("products");
}

/* ---------- teams / drivers / categories ---------- */

const seo = (fd: FormData) => ({ seoTitle: opt(fd, "seoTitle"), seoDescription: opt(fd, "seoDescription") });

export async function saveTeam(_: FormState, fd: FormData): Promise<FormState> {
  const id = idOf(fd);
  let newId: number | null = null;
  const res = await attempt(async () => {
    const color = opt(fd, "color");
    if (color && !/^#[0-9a-f]{6}$/i.test(color)) throw new InputError("Colour must be a hex value like #e10600.");
    const values = {
      ...slugged(fd),
      color,
      description: opt(fd, "description"),
      logoId: Number(fd.get("logoId")) || null,
      sortOrder: int(fd, "sortOrder", "Sort order") ?? 0,
      published: bool(fd, "published"),
      ...seo(fd),
      updatedAt: new Date(),
    };
    if (id) await db.update(teams).set(values).where(eq(teams.id, id));
    else newId = (await db.insert(teams).values(values).returning({ id: teams.id }))[0].id;
    expireAll();
  });
  if (res?.ok && newId) redirect(`${ADMIN}/teams/${newId}?created=1`);
  return res;
}

export async function saveDriver(_: FormState, fd: FormData): Promise<FormState> {
  const id = idOf(fd);
  let newId: number | null = null;
  const res = await attempt(async () => {
    const values = {
      ...slugged(fd),
      number: int(fd, "number", "Number"),
      teamId: Number(fd.get("teamId")) || null,
      portraitId: Number(fd.get("portraitId")) || null,
      description: opt(fd, "description"),
      featured: bool(fd, "featured"),
      sortOrder: int(fd, "sortOrder", "Sort order") ?? 0,
      published: bool(fd, "published"),
      ...seo(fd),
      updatedAt: new Date(),
    };
    if (id) await db.update(drivers).set(values).where(eq(drivers.id, id));
    else newId = (await db.insert(drivers).values(values).returning({ id: drivers.id }))[0].id;
    expireAll();
  });
  if (res?.ok && newId) redirect(`${ADMIN}/drivers/${newId}?created=1`);
  return res;
}

export async function saveCategory(_: FormState, fd: FormData): Promise<FormState> {
  const id = idOf(fd);
  let newId: number | null = null;
  const res = await attempt(async () => {
    const values = {
      ...slugged(fd),
      description: opt(fd, "description"),
      isAccessory: bool(fd, "isAccessory"),
      showAsTab: bool(fd, "showAsTab"),
      sortOrder: int(fd, "sortOrder", "Sort order") ?? 0,
      published: bool(fd, "published"),
      ...seo(fd),
      updatedAt: new Date(),
    };
    if (id) await db.update(categories).set(values).where(eq(categories.id, id));
    else newId = (await db.insert(categories).values(values).returning({ id: categories.id }))[0].id;
    expireAll();
  });
  if (res?.ok && newId) redirect(`${ADMIN}/categories/${newId}?created=1`);
  return res;
}

// Products keep existing when their team/driver/category goes (FKs set null).
export async function deleteTeam(fd: FormData) {
  await requireAdmin();
  assertDb();
  await db.delete(teams).where(eq(teams.id, Number(fd.get("id"))));
  expireAll();
  redirect(`${ADMIN}/teams`);
}

export async function deleteDriver(fd: FormData) {
  await requireAdmin();
  assertDb();
  await db.delete(drivers).where(eq(drivers.id, Number(fd.get("id"))));
  expireAll();
  redirect(`${ADMIN}/drivers`);
}

export async function deleteCategory(fd: FormData) {
  await requireAdmin();
  assertDb();
  await db.delete(categories).where(eq(categories.id, Number(fd.get("id"))));
  expireAll();
  redirect(`${ADMIN}/categories`);
}

/* ---------- orders ---------- */

const STATUSES = ["new", "confirmed", "paid", "shipped", "delivered", "cancelled"] as const;

export async function updateOrder(_: FormState, fd: FormData): Promise<FormState> {
  return attempt(async () => {
    const id = idOf(fd);
    if (!id) throw new InputError("Missing order.");
    const status = z.enum(STATUSES).parse(str(fd, "status")) as OrderStatus;
    try {
      await setOrderStatus(id, status);
    } catch (e) {
      throw new InputError((e as Error).message);
    }
    await db.update(orders).set({ adminNote: opt(fd, "adminNote"), updatedAt: new Date() }).where(eq(orders.id, id));
    // Cancelling or restoring changes stock on the site.
    expire("products");
  });
}

export async function deleteOrder(fd: FormData) {
  await requireAdmin();
  assertDb();
  const id = Number(fd.get("id"));
  // Put stock back first if the order was still holding it.
  const [o] = await db.select({ status: orders.status }).from(orders).where(eq(orders.id, id));
  if (o && o.status !== "cancelled" && o.status !== "delivered" && o.status !== "shipped") await setOrderStatus(id, "cancelled");
  await db.delete(orders).where(eq(orders.id, id));
  expire("products");
  redirect(`${ADMIN}/orders`);
}

/* ---------- settings ---------- */

export async function saveSettings(_: FormState, fd: FormData): Promise<FormState> {
  return attempt(async () => {
    const pipe = (k: string) => lines(fd, k).map((l) => l.split("|").map((x) => x.trim()));
    const zones = pipe("deliveryZones").map(([name, fee]) => {
      const n = Number((fee ?? "0").replace(/[, ]/g, "").replace(/^rs\.?/i, ""));
      if (!name || !Number.isInteger(n) || n < 0) throw new InputError(`Delivery area “${name ?? ""}”: write it as “Area | fee”, e.g. “Jhapa | 100”.`);
      return { name, fee: n };
    });
    const payments = pipe("paymentMethods").map(([label, ...rest]) => ({ key: slugify(label), label, instructions: rest.join(" | ") || null }));
    if (new Set(payments.map((p) => p.key)).size !== payments.length) throw new InputError("Two payment methods have the same name.");
    const steps = pipe("steps").map(([title, ...rest]) => ({ title, body: rest.join(" | ") }));
    const instagramUrl = opt(fd, "instagramUrl");
    if (instagramUrl && !/^https:\/\//.test(instagramUrl)) throw new InputError("Instagram link must start with https://");

    const value: SiteSettings = {
      ...defaultSettings,
      storeName: str(fd, "storeName") || defaultSettings.storeName,
      tagline: opt(fd, "tagline"),
      location: opt(fd, "location"),
      streetAddress: opt(fd, "streetAddress"),
      phone: opt(fd, "phone"),
      email: opt(fd, "email"),
      instagramUrl,
      instagramHandle: opt(fd, "instagramHandle"),
      whatsapp: opt(fd, "whatsapp"),
      announcements: lines(fd, "announcements"),
      heroStyle: str(fd, "heroStyle") === "light" ? "light" : "dark",
      heroEyebrow: opt(fd, "heroEyebrow"),
      heroTitle: opt(fd, "heroTitle"),
      heroBody: opt(fd, "heroBody"),
      heroImageId: Number(fd.get("heroImageId")) || null,
      heroProductId: Number(fd.get("heroProductId")) || null,
      heroSecondaryLabel: opt(fd, "heroSecondaryLabel"),
      heroSecondaryHref: opt(fd, "heroSecondaryHref"),
      heroWatermark: opt(fd, "heroWatermark"),
      steps,
      deliveryZones: zones,
      freeDeliveryOver: int(fd, "freeDeliveryOver", "Free delivery over"),
      paymentMethods: payments,
      lowStockThreshold: int(fd, "lowStockThreshold", "Low stock threshold") ?? 2,
      deliveryInfo: opt(fd, "deliveryInfo"),
      returnsInfo: opt(fd, "returnsInfo"),
      contactInfo: opt(fd, "contactInfo"),
      footerDisclaimer: opt(fd, "footerDisclaimer"),
      seoTitle: opt(fd, "seoTitle"),
      seoDescription: opt(fd, "seoDescription"),
    };
    await db
      .insert(settings)
      .values({ key: "site", value })
      .onConflictDoUpdate({ target: settings.key, set: { value, updatedAt: new Date() } });
    expire("settings");
  });
}

/* ---------- maintenance ---------- */

// For a fresh production database: the same idempotent seed as `npm run db:seed`.
// Starter images are fetched from this site's own /assets.
export async function importStarterContent() {
  await requireAdmin();
  assertDb();
  await seedDatabase(async (file) => {
    const r = await fetch(`${SITE_URL}/assets/${file}`);
    if (!r.ok) throw new Error(`Couldn't fetch /assets/${file} (${r.status}). Is SITE_URL right?`);
    return Buffer.from(await r.arrayBuffer());
  });
  expireAll();
  redirect(ADMIN);
}

export async function refreshPublicPages() {
  await requireAdmin();
  expireAll();
  redirect(`${ADMIN}?refreshed=1`);
}
