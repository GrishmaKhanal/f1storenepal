# Caching: how edits go live without a redeploy

Public pages are static HTML: fast, cheap, and easy for crawlers. Cache **tags** decide when they rebuild.

## The three tags

Defined in `src/lib/data.ts`:

| Tag | Covers | Expired by |
|---|---|---|
| `settings` | `getSettings` (site copy, hero, delivery/payment, SEO defaults), so every page | `saveSettings`, `saveProduct`/`deleteProduct` (hero product), media and catalogue saves |
| `catalog` | `getCatalog`: teams, drivers, categories and their product counts (menus, tiles, collection pages) | team/driver/category saves and deletes, media saves |
| `products` | `getProducts`: every product view (cards, product pages, sitemap, search) | product saves/deletes, `setStock`, **orders placed**, order status changes and deletes |

`getCatalog` is tagged `catalog` **and** `products`, because its counts come from active products.

Cached reads have no time-based expiry (`revalidate: false`). The database is only queried after a save, an order, a first visit to a never-built URL, or a build. That's deliberate: Neon scales to zero, and a timed refresh would wake it for every crawler.

## Lifecycle

```
admin saves product ─▶ db write ─▶ updateTag("products")
                                        │
next visitor to /products/x ─▶ miss ────┴─▶ query once ─▶ render ─▶ cached until the next updateTag
```

Stock changes from checkout also expire `products`, so "Only 2 left" and "Sold out" stay accurate.

## Needs a redeploy

- Code or style changes.
- Schema changes (plus a migration; see [../database/migrations.md](../database/migrations.md)).
- Changing `SITE_URL` or `MEDIA_PUBLIC_URL` (they're read at build/render time).

## Gotchas

- **Edits made outside the admin** (`npm run db:seed`, `db:studio`, raw SQL) don't expire any tag. Use **Refresh public pages** on the dashboard. Locally you can also stop `npm run dev` and delete `.next/`.
- If you add a query, give it a tag and expire that tag from every action that changes its data. A missing `updateTag` shows up as "I saved but the site still shows the old version", and it stays that way until Refresh public pages or the next deploy.
- `unstable_cache` stores JSON, so dates come back as strings. `revive()` in `data.ts` converts keys listed in `DATE_KEYS`; add new timestamp names there.
- Product, team, driver and category slugs are prerendered at build. New slugs render on first visit, then are cached. Unknown slugs cost one cached-data lookup, not a DB query.
