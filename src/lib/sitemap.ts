import type { MetadataRoute } from "next";

export type SitemapEntry = Pick<MetadataRoute.Sitemap[number], "url" | "lastModified" | "changeFrequency" | "priority" | "images">;

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

// Next's own sitemap.ts serializer writes <image:image> before <lastmod>, which the
// sitemaps.org 0.9 schema rejects (extensions must follow <priority>). Search Console
// reported the sitemap as unreadable, so it is serialized here in schema order.
export function sitemapXml(entries: SitemapEntry[]): string {
  const urls = entries.map((e) => {
    const lastmod = e.lastModified && (e.lastModified instanceof Date ? e.lastModified.toISOString() : e.lastModified);
    return [
      "<url>",
      `<loc>${esc(e.url)}</loc>`,
      lastmod && `<lastmod>${esc(lastmod)}</lastmod>`,
      e.changeFrequency && `<changefreq>${e.changeFrequency}</changefreq>`,
      e.priority != null && `<priority>${e.priority}</priority>`,
      ...(e.images ?? []).map((i) => `<image:image><image:loc>${esc(i)}</image:loc></image:image>`),
      "</url>",
    ]
      .filter(Boolean)
      .join("\n");
  });
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">',
    ...urls,
    "</urlset>",
    "",
  ].join("\n");
}
