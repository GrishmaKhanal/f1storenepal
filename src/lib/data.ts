import "server-only";
import { unstable_cache } from "next/cache";
import { asc, desc, eq, inArray } from "drizzle-orm";
import { db, hasDb } from "@/db";
import { categories, drivers, media, products, productImages, productVariants, settings, teams, type Media, type SiteSettings } from "@/db/schema";
import { defaultSettings, seedCategories, seedDrivers, seedProducts, seedTeams } from "@/content/seed";
import { mediaSrcSet, mediaUrl } from "./media-url";
import { slugify } from "./slug";
import { hasAvailableStock } from "./product-stock";

// Cache tags. Admin writes expire these so public pages update without a redeploy.
export const TAGS = { settings: "settings", catalog: "catalog", products: "products" } as const;

const DATE_KEYS = ["publishedAt", "createdAt", "updatedAt"];

// unstable_cache JSON-serialises results; revive Date fields (at any depth) afterwards.
function revive<T>(v: T): T {
  if (Array.isArray(v)) return v.map(revive) as T;
  if (v && typeof v === "object" && !(v instanceof Date)) {
    const o: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(v)) {
      o[k] = DATE_KEYS.includes(k) && typeof val === "string" ? new Date(val) : revive(val);
    }
    return o as T;
  }
  return v;
}

// No time-based expiry: each read hits the database again only after its tag is
// expired, so a scale-to-zero database (Neon) isn't woken by crawlers.
function cached<A extends unknown[], R>(fn: (...a: A) => Promise<R>, key: string, tags: string[]) {
  const c = unstable_cache(fn, [key], { tags, revalidate: false });
  return async (...a: A) => revive(await c(...a));
}

/* ---------- view types (plain data, safe to pass to client components) ---------- */

export type Img = { src: string; large: string; srcSet: string; width: number; height: number; alt: string };

export const toImg = (m: Pick<Media, "storageKey" | "widths" | "width" | "height" | "alt">): Img => ({
  src: mediaUrl(m, 960),
  large: mediaUrl(m),
  srcSet: mediaSrcSet(m),
  width: m.width,
  height: m.height,
  alt: m.alt,
});

export type TeamView = { id: number; slug: string; name: string; color: string | null; description: string | null; logo: Img | null; count: number; seoTitle: string | null; seoDescription: string | null; updatedAt: Date };
export type DriverView = { id: number; slug: string; name: string; number: number | null; featured: boolean; description: string | null; team: TeamRef | null; portrait: Img | null; count: number; seoTitle: string | null; seoDescription: string | null; updatedAt: Date };
export type CategoryView = { id: number; slug: string; name: string; description: string | null; isAccessory: boolean; showAsTab: boolean; count: number; seoTitle: string | null; seoDescription: string | null; updatedAt: Date };
export type TeamRef = { slug: string; name: string; color: string | null };

export type VariantView = { id: number; label: string | null; price: number | null; stock: number | null; available: boolean };

export type ProductView = {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  brand: string | null;
  scale: string | null;
  price: number | null;
  compareAtPrice: number | null;
  badge: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  publishedAt: Date | null;
  updatedAt: Date;
  team: TeamRef | null;
  driver: { slug: string; name: string; number: number | null } | null;
  category: { slug: string; name: string; isAccessory: boolean } | null;
  images: Img[];
  variants: VariantView[];
  inStock: boolean;
};

export type Catalog = { teams: TeamView[]; drivers: DriverView[]; categories: CategoryView[] };

export type Settings = SiteSettings & { heroImage: Img | null };

/* ---------- reads ---------- */

async function _getSettings(): Promise<Settings> {
  if (!hasDb) return { ...defaultSettings, heroImage: null };
  const row = await db.query.settings.findFirst({ where: eq(settings.key, "site") });
  // A stored value may predate newer fields; fill gaps from the defaults.
  const s: SiteSettings = { ...defaultSettings, ...(row?.value ?? {}) };
  const hero = s.heroImageId ? await db.query.media.findFirst({ where: eq(media.id, s.heroImageId) }) : null;
  return { ...s, heroImage: hero ? toImg(hero) : null };
}

async function _getProducts(): Promise<ProductView[]> {
  if (!hasDb) return seedProductViews();
  const [rows, ts, ds, cs] = await Promise.all([
    db.select().from(products).where(eq(products.status, "active")).orderBy(asc(products.sortOrder), desc(products.publishedAt)),
    db.select().from(teams).where(eq(teams.published, true)),
    db.select().from(drivers).where(eq(drivers.published, true)),
    db.select().from(categories).where(eq(categories.published, true)),
  ]);
  const ids = rows.map((r) => r.id);
  const [vs, imgs] = ids.length
    ? await Promise.all([
        db.select().from(productVariants).where(inArray(productVariants.productId, ids)).orderBy(asc(productVariants.sortOrder), asc(productVariants.id)),
        db
          .select({ productId: productImages.productId, m: media })
          .from(productImages)
          .innerJoin(media, eq(media.id, productImages.mediaId))
          .where(inArray(productImages.productId, ids))
          .orderBy(asc(productImages.sortOrder)),
      ])
    : [[], []];

  return rows.map((p) => {
    const team = ts.find((t) => t.id === p.teamId);
    const driver = ds.find((d) => d.id === p.driverId);
    const cat = cs.find((c) => c.id === p.categoryId);
    const variants = vs
      .filter((v) => v.productId === p.id)
      .map((v) => {
        const price = v.price ?? p.price;
        return { id: v.id, label: v.label, price, stock: v.stock, available: price != null && (v.stock == null || v.stock > 0) };
      });
    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      description: p.description,
      brand: p.brand,
      scale: p.scale,
      price: p.price,
      compareAtPrice: p.compareAtPrice,
      badge: p.badge,
      seoTitle: p.seoTitle,
      seoDescription: p.seoDescription,
      publishedAt: p.publishedAt,
      updatedAt: p.updatedAt,
      team: team ? { slug: team.slug, name: team.name, color: team.color } : null,
      driver: driver ? { slug: driver.slug, name: driver.name, number: driver.number } : null,
      category: cat ? { slug: cat.slug, name: cat.name, isAccessory: cat.isAccessory } : null,
      images: imgs.filter((i) => i.productId === p.id).map((i) => toImg(i.m)),
      variants,
      inStock: hasAvailableStock(variants),
    };
  });
}

async function _getCatalog(): Promise<Catalog> {
  const ps = await _getProducts();
  const countBy = (pick: (p: ProductView) => string | undefined) => {
    const m = new Map<string, number>();
    for (const p of ps) {
      const k = pick(p);
      if (k) m.set(k, (m.get(k) ?? 0) + 1);
    }
    return m;
  };
  const byTeam = countBy((p) => p.team?.slug);
  const byDriver = countBy((p) => p.driver?.slug);
  const byCat = countBy((p) => p.category?.slug);

  if (!hasDb) {
    const now = new Date(0);
    const ts = seedTeams.map(([name, color], i) => ({ id: i + 1, slug: slugify(name), name, color, description: null, logo: null, count: byTeam.get(slugify(name)) ?? 0, seoTitle: null, seoDescription: null, updatedAt: now }));
    return {
      teams: ts,
      drivers: seedDrivers.map(([number, name, team, featured], i) => {
        const t = ts.find((x) => x.name === team);
        return { id: i + 1, slug: slugify(name), name, number, featured, description: null, portrait: null, team: t ? { slug: t.slug, name: t.name, color: t.color } : null, count: byDriver.get(slugify(name)) ?? 0, seoTitle: null, seoDescription: null, updatedAt: now };
      }),
      categories: seedCategories.map(([name, isAccessory, showAsTab], i) => ({ id: i + 1, slug: slugify(name), name, description: null, isAccessory, showAsTab, count: byCat.get(slugify(name)) ?? 0, seoTitle: null, seoDescription: null, updatedAt: now })),
    };
  }

  const [ts, ds, cs] = await Promise.all([
    db.select().from(teams).where(eq(teams.published, true)).orderBy(asc(teams.sortOrder), asc(teams.name)),
    db.select().from(drivers).where(eq(drivers.published, true)).orderBy(asc(drivers.sortOrder), asc(drivers.name)),
    db.select().from(categories).where(eq(categories.published, true)).orderBy(asc(categories.sortOrder), asc(categories.name)),
  ]);
  const mediaIds = [...ts.map((t) => t.logoId), ...ds.map((d) => d.portraitId)].filter((x): x is number => x != null);
  const ms = mediaIds.length ? await db.select().from(media).where(inArray(media.id, mediaIds)) : [];
  const img = (id: number | null) => {
    const m = id != null ? ms.find((x) => x.id === id) : undefined;
    return m ? toImg(m) : null;
  };

  return {
    teams: ts.map((t) => ({ id: t.id, slug: t.slug, name: t.name, color: t.color, description: t.description, logo: img(t.logoId), count: byTeam.get(t.slug) ?? 0, seoTitle: t.seoTitle, seoDescription: t.seoDescription, updatedAt: t.updatedAt })),
    drivers: ds.map((d) => {
      const t = ts.find((x) => x.id === d.teamId);
      return { id: d.id, slug: d.slug, name: d.name, number: d.number, featured: d.featured, description: d.description, portrait: img(d.portraitId), team: t ? { slug: t.slug, name: t.name, color: t.color } : null, count: byDriver.get(d.slug) ?? 0, seoTitle: d.seoTitle, seoDescription: d.seoDescription, updatedAt: d.updatedAt };
    }),
    categories: cs.map((c) => ({ id: c.id, slug: c.slug, name: c.name, description: c.description, isAccessory: c.isAccessory, showAsTab: c.showAsTab, count: byCat.get(c.slug) ?? 0, seoTitle: c.seoTitle, seoDescription: c.seoDescription, updatedAt: c.updatedAt })),
  };
}

function seedProductViews(): ProductView[] {
  const now = new Date(0);
  return seedProducts.map((p, i) => {
    const color = seedTeams.find(([n]) => n === p.team)?.[1] ?? null;
    const variants = p.variants.map((v, j) => ({ id: i * 10 + j + 1, label: v.label, price: p.price, stock: v.stock, available: false }));
    return {
      id: i + 1,
      slug: slugify(p.name),
      name: p.name,
      description: p.description,
      brand: p.brand,
      scale: p.scale,
      price: p.price,
      compareAtPrice: null,
      badge: p.badge,
      seoTitle: null,
      seoDescription: null,
      publishedAt: now,
      updatedAt: now,
      team: p.team ? { slug: slugify(p.team), name: p.team, color } : null,
      driver: p.driver ? { slug: slugify(p.driver), name: p.driver, number: seedDrivers.find(([, n]) => n === p.driver)?.[0] ?? null } : null,
      category: { slug: slugify(p.category), name: p.category, isAccessory: seedCategories.find(([n]) => n === p.category)?.[1] ?? false },
      images: [],
      // Without a database nothing can be ordered.
      variants,
      inStock: false,
    };
  });
}

const cachedSettings = cached(_getSettings, "settings", [TAGS.settings]);
// The cache never expires on its own, so it can hold a value written by older code.
// Fill any field added since from the defaults here too, not only inside _getSettings.
export const getSettings = async (): Promise<Settings> => ({ ...defaultSettings, ...(await cachedSettings()) });
export const getProducts = cached(_getProducts, "products", [TAGS.products]);
export const getCatalog = cached(_getCatalog, "catalog", [TAGS.catalog, TAGS.products]);

export async function getProduct(slug: string) {
  return (await getProducts()).find((p) => p.slug === slug) ?? null;
}

/** "New in": newest first by publish date. */
export async function getNewest(limit?: number) {
  const ps = [...(await getProducts())].sort((a, b) => (b.publishedAt?.getTime() ?? 0) - (a.publishedAt?.getTime() ?? 0));
  return limit ? ps.slice(0, limit) : ps;
}
