import type { MetadataRoute } from "next";
import { getCatalog, getProducts } from "@/lib/data";
import { abs, paths } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, { teams, drivers, categories }] = await Promise.all([getProducts(), getCatalog()]);
  const latest = products.reduce<Date | undefined>((acc, p) => (!acc || p.updatedAt > acc ? p.updatedAt : acc), undefined);

  const pages = ["", "/shop", "/new", "/teams", "/drivers", "/accessories", "/delivery", "/returns", "/contact"].map((p) => ({
    url: abs(p || "/"),
    lastModified: latest,
    changeFrequency: "daily" as const,
    priority: p === "" ? 1 : 0.7,
  }));

  return [
    ...pages,
    ...products.map((p) => ({
      url: abs(paths.product(p.slug)),
      lastModified: p.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.9,
      images: p.images.slice(0, 3).map((i) => abs(i.large)),
    })),
    ...teams.filter((t) => t.count).map((t) => ({ url: abs(paths.team(t.slug)), lastModified: t.updatedAt, priority: 0.8 })),
    ...drivers.filter((d) => d.count).map((d) => ({ url: abs(paths.driver(d.slug)), lastModified: d.updatedAt, priority: 0.8 })),
    ...categories.filter((c) => c.count && c.isAccessory).map((c) => ({ url: abs(paths.category(c.slug)), lastModified: c.updatedAt, priority: 0.7 })),
  ];
}
