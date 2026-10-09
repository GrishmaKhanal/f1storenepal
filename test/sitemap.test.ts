import { test } from "node:test";
import assert from "node:assert/strict";
import { sitemapXml } from "../src/lib/sitemap";

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
