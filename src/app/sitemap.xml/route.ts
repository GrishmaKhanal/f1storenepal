import { getCatalog, getProducts } from "@/lib/data";
import { abs, paths } from "@/lib/site";
import { sitemapXml, type SitemapEntry } from "@/lib/sitemap";

// Prerendered like the sitemap.ts it replaces; the admin's updateTag calls expire it
// along with the catalog data it reads.
export const dynamic = "force-static";

export async function GET() {
  const [products, { teams, drivers, categories }] = await Promise.all([getProducts(), getCatalog()]);
  const latest = products.reduce<Date | undefined>((acc, p) => (!acc || p.updatedAt > acc ? p.updatedAt : acc), undefined);

  // Listing pages change whenever a product does; the info pages don't, so they get no
  // lastmod rather than a misleading one.
  const listings = ["/", "/shop", "/new", "/teams", "/drivers", "/accessories"].map((p) => ({
    url: abs(p),
    lastModified: latest,
    changeFrequency: "daily" as const,
    priority: p === "/" ? 1 : 0.7,
  }));
  const info = ["/delivery", "/returns", "/contact"].map((p) => ({ url: abs(p), changeFrequency: "monthly" as const, priority: 0.3 }));

  const entries: SitemapEntry[] = [
    ...listings,
    ...info,
    ...products.map((p) => ({
      url: abs(paths.product(p.slug)),
      lastModified: p.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.9,
      images: p.images.slice(0, 3).map((i) => abs(i.large)),
    })),
    ...teams.filter((t) => t.count).map((t) => ({ url: abs(paths.team(t.slug)), lastModified: t.updatedAt, priority: 0.8 })),
    ...drivers.filter((d) => d.count).map((d) => ({ url: abs(paths.driver(d.slug)), lastModified: d.updatedAt, priority: 0.8 })),
    // Every non-empty category has an indexable page (diecast too), not just accessories.
    ...categories.filter((c) => c.count).map((c) => ({ url: abs(paths.category(c.slug)), lastModified: c.updatedAt, priority: 0.7 })),
  ];

  return new Response(sitemapXml(entries), { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}
