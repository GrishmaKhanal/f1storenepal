# Architecture

One Next.js app and one Postgres database, plus an S3-compatible bucket for images. Each file runs in exactly one place.

## Server only (the "backend")

| Path | Role |
|---|---|
| `src/proxy.ts` | Runs before every request. Maps the secret `ADMIN_PATH` onto `src/app/admin`, checks the session cookie, and 404s `/admin`. |
| `src/db/schema.ts` | Tables (Drizzle). Single source of truth for the schema; migrations in `drizzle/`. |
| `src/db/index.ts` | DB client. Neon HTTP driver for `*.neon.tech`, node-postgres otherwise. `withTx()` opens a real transaction (a short-lived WebSocket pool on Neon). |
| `src/lib/data.ts` | All **public reads**, tag-cached (`settings`, `catalog`, `products`). Falls back to `src/content/seed.ts` without a database. |
| `src/lib/pricing.ts` | Pure pricing: merges the bag, re-prices from DB rows, flags stock problems, delivery fee. Unit-tested. |
| `src/lib/orders.ts` | `placeOrder` (one transaction: guarded stock decrement + order insert) and `setOrderStatus` (cancel returns stock). |
| `src/lib/images.ts`, `media-store.ts` | Upload pipeline (sniff type, cap 4 MB, `sharp` to WebP at 480/960/1600) and the bucket client (local folder fallback). |
| `src/lib/auth.ts`, `credentials.ts` | Env credentials (constant-time), JWT cookie, `requireAdmin()`. |
| `src/app/actions/checkout.ts` | Public Server Actions: `quoteBag`, `submitOrder` (zod-validated, honeypot). |
| `src/app/admin/actions.ts` | All **admin writes**. Each calls `requireAdmin()` and then `updateTag(...)`. |

## Rendered on the server

`src/app/(site)/**` (the storefront) and `src/app/admin/**` (the admin) are server components that read through `data.ts` or Drizzle and send HTML.

## Runs in the browser

Only `"use client"` files: `components/bag.tsx` (bag in `localStorage`, drawer, toast), `MegaNav.tsx`, `NewInTabs.tsx`, `ProductBuy.tsx` (gallery and variant picker), `checkout/form.tsx`, and the admin form components. They get data as props and write through Server Actions; they never import `@/db`, `@/lib/data` or `@/lib/auth`.

## Images: why a bucket, not the database

Image bytes in Postgres would be about a third larger (base64), eat the free-tier storage cap, and put every image view through a function and a DB read. Instead:

- **Upload:** an admin Server Action converts the image to WebP at up to 3 widths and `PUT`s them to the bucket with `Cache-Control: immutable`. A `media` row stores only the **key**, dimensions, alt text and name.
- **View:** pages build `MEDIA_PUBLIC_URL/<key>-<w>.webp` at render time. The browser loads it from the CDN; the app and the database are never involved.
- **Swap providers:** an env change and a bucket copy. Rows never hold full URLs.
- **Delete:** refused while the image is used by a product, team, driver or the hero.

## Checkout

1. The bag lives in the browser with display snapshots.
2. `/checkout` calls `quoteBag` on every change: prices and stock come from the database.
3. `submitOrder` validates the customer, then `placeOrder` runs one transaction: it re-prices, decrements each tracked variant only `where stock >= qty`, and inserts the order and items (with name and price snapshots). Two customers racing for the last unit can't both get it.
4. The customer lands on `/order/<random token>`, which shows items and totals but never the address or phone.
5. No payment is taken online. The payment method and its instructions (from Settings) are shown, and the store confirms by phone.

## Caching

| Tag | Covers | Expired by |
|---|---|---|
| `settings` | site copy, hero, delivery and payment settings | `saveSettings`, product/media saves |
| `catalog` | teams, drivers, categories and their product counts | team/driver/category saves, any product change |
| `products` | every product view | product saves, stock edits, orders placed or cancelled |

Changes made outside the admin (seed script, SQL, Drizzle Studio) need **Refresh public pages** on the dashboard.
