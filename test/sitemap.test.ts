import { test } from "node:test";
import assert from "node:assert/strict";
import { productEntry, sitemapXml } from "../src/lib/sitemap";
import { SITE_URL } from "../src/lib/site";

test("sitemap puts image:image after lastmod/changefreq/priority, as the 0.9 schema requires", () => {
  const xml = sitemapXml([
    { url: "https://x.test/products/a", lastModified: new Date("2026-10-07T05:42:44.504Z"), changeFrequency: "weekly", priority: 0.9, images: ["https://cdn.test/a.webp"] },
  ]);
  const at = (s: string) => xml.indexOf(s);
  assert.ok(at("<loc>") < at("<lastmod>"));
  assert.ok(at("<lastmod>") < at("<changefreq>"));
  assert.ok(at("<changefreq>") < at("<priority>"));
  assert.ok(at("<priority>") < at("<image:image>"), "image extension must come last inside <url>");
  assert.match(xml, /<lastmod>2026-10-07T05:42:44\.504Z<\/lastmod>/);
  assert.match(xml, /xmlns:image="http:\/\/www\.google\.com\/schemas\/sitemap-image\/1\.1"/);
});

test("sitemap omits optional fields that aren't set and escapes XML", () => {
  const xml = sitemapXml([{ url: "https://x.test/search?a=1&b=<2>" }]);
  assert.match(xml, /<url>\s*<loc>https:\/\/x\.test\/search\?a=1&amp;b=&lt;2&gt;<\/loc>\s*<\/url>/);
  assert.doesNotMatch(xml, /lastmod|changefreq|priority|image:image/);
  assert.ok(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>'));
});

test("product entries list every photo, absolute and once each, as separate image:image tags", () => {
  const large = (n: number) => ({ large: `https://cdn.test/${n}.webp` });
  const e = productEntry({ slug: "lh44", updatedAt: new Date("2026-10-07T00:00:00Z"), images: [large(1), large(2), large(3), large(4), large(2), { large: "/media/5.webp" }] });
  assert.match(e.url, /\/products\/lh44$/);
  assert.deepEqual(e.images, ["https://cdn.test/1.webp", "https://cdn.test/2.webp", "https://cdn.test/3.webp", "https://cdn.test/4.webp", `${SITE_URL}/media/5.webp`]);
  const xml = sitemapXml([e]);
  assert.equal(xml.match(/<image:image><image:loc>[^<]+<\/image:loc><\/image:image>/g)?.length, 5);
});

test("product entries without photos have no image tags", () => {
  assert.deepEqual(productEntry({ slug: "a", updatedAt: new Date(0), images: [] }).images, []);
  assert.doesNotMatch(sitemapXml([productEntry({ slug: "a", updatedAt: new Date(0), images: [] })]), /image:image/);
});
