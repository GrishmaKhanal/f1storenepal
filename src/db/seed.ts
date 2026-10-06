import { count, eq } from "drizzle-orm";
import { db } from "./index";
import { categories, drivers, media, products, productImages, productVariants, settings, teams } from "./schema";
import { defaultSettings, seedCategories, seedDrivers, seedProducts, seedTeams } from "../content/seed";
import { processAndStore } from "../lib/images";
import { slugify } from "../lib/slug";

/**
 * Idempotent starter import: does nothing once any team exists. `loadAsset` reads a
 * file from public/assets (from disk in the CLI, over HTTP from a deployed admin).
 */
export async function seedDatabase(loadAsset: (file: string) => Promise<Buffer>, opts: { remoteImages?: boolean } = {}) {
  const [{ n }] = await db.select({ n: count() }).from(teams);
  if (n > 0) return { skipped: true };

  const teamRows = await db
    .insert(teams)
    .values(seedTeams.map(([name, color], i) => ({ name, color, slug: slugify(name), sortOrder: i })))
    .returning();
  const teamId = (name: string | null) => teamRows.find((t) => t.name === name)?.id ?? null;

  const driverRows = await db
    .insert(drivers)
    .values(
      seedDrivers.map(([number, name, team, featured], i) => ({
        name,
        number,
        featured,
        slug: slugify(name),
        teamId: teamId(team),
        sortOrder: i,
      })),
    )
    .returning();

  const catRows = await db
    .insert(categories)
    .values(seedCategories.map(([name, isAccessory, showAsTab], i) => ({ name, isAccessory, showAsTab, slug: slugify(name), sortOrder: i })))
    .returning();

  // https URLs (manufacturer photos) are fetched; anything else is a file in public/assets.
  const load = async (src: string) => {
    if (!/^https:\/\//.test(src)) return loadAsset(src);
    const r = await fetch(src, { headers: { "User-Agent": "Mozilla/5.0 (Lights Out Nepal starter import)" }, signal: AbortSignal.timeout(20_000) });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return Buffer.from(await r.arrayBuffer());
  };

  let heroProductId: number | null = null;
  let heroImageId: number | null = null;
  const now = Date.now();

  for (const [i, p] of seedProducts.entries()) {
    const [row] = await db
      .insert(products)
      .values({
        name: p.name,
        slug: slugify(p.name),
        description: p.description,
        teamId: teamId(p.team),
        driverId: driverRows.find((d) => d.name === p.driver)?.id ?? null,
        categoryId: catRows.find((c) => c.name === p.category)?.id ?? null,
        brand: p.brand,
        scale: p.scale,
        price: p.price,
        badge: p.badge,
        status: "active",
        sortOrder: i,
        // Newest first on "New in": keep the design's order.
        publishedAt: new Date(now - i * 60_000),
      })
      .returning({ id: products.id });
    await db.insert(productVariants).values(p.variants.map((v, j) => ({ ...v, productId: row.id, sortOrder: j })));

    // Download and process up to 4 images at a time; a photo that fails is skipped
    // rather than failing the whole import.
    const srcs = opts.remoteImages === false ? p.images.filter((x) => !/^https:/.test(x)) : p.images;
    const stored = await mapLimit(srcs, 4, async (src) => {
      try {
        return await processAndStore(await load(src), "products");
      } catch (e) {
        console.warn(`seed: skipped image ${src}: ${(e as Error).message}`);
        return null;
      }
    });
    let sort = 0;
    for (const img of stored) {
      if (!img) continue;
      const [m] = await db
        .insert(media)
        .values({ ...img, name: p.name, alt: sort === 0 ? p.name : `${p.name}, view ${sort + 1}` })
        .returning({ id: media.id });
      await db.insert(productImages).values({ productId: row.id, mediaId: m.id, sortOrder: sort });
      if (p.hero && sort === 0) {
        heroProductId = row.id;
        heroImageId = m.id;
      }
      sort++;
    }
  }

  const value = { ...defaultSettings, heroProductId, heroImageId };
  const existing = await db.select().from(settings).where(eq(settings.key, "site"));
  if (existing.length) await db.update(settings).set({ value }).where(eq(settings.key, "site"));
  else await db.insert(settings).values({ key: "site", value });

  return { skipped: false };
}

async function mapLimit<T, R>(items: T[], limit: number, fn: (t: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        out[i] = await fn(items[i]);
      }
    }),
  );
  return out;
}
