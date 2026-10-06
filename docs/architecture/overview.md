# Overview: one app, two halves

## Do we need a separate backend?

No. The site is one Next.js app deployed as one unit, but the code is split cleanly:

- **Backend:** server-only modules that touch the database, the image bucket and secrets. They never ship to the browser.
- **Frontend:** a handful of `"use client"` components (bag, menus, checkout form, admin forms) that get data as props and write through **Server Actions**.

A separate API server would add a second deploy, CORS, a token scheme and duplicated types, with no gain for a single-store site. If a mobile app or a third party ever needs the data, add route handlers under `src/app/api/` that call the same `src/lib/*` functions.

```
Browser ──HTML──▶ server components (src/app/(site), src/app/admin)
   │                      │ read
   │                      ▼
   │               src/lib/data.ts (tag-cached) ──▶ Postgres
   │
   └──Server Action──▶ src/app/actions/checkout.ts, src/app/admin/actions.ts
                           │ write                       │ upload
                           ▼                             ▼
                        Postgres                 S3-compatible bucket ──CDN──▶ Browser (images)
```

## Server only (the "backend")

| Path | Role |
|---|---|
| `src/proxy.ts` | Runs before every request. Maps the secret `ADMIN_PATH` onto `src/app/admin`, checks the session cookie, and 404s `/admin`. See [admin-and-auth.md](admin-and-auth.md). |
| `src/db/schema.ts` | Tables (Drizzle). Single source of truth; SQL in `drizzle/`. See [../database/schema.md](../database/schema.md). |
| `src/db/index.ts` | DB client: Neon HTTP driver for `*.neon.tech`, node-postgres otherwise. `withTx()` opens a real transaction (a short-lived WebSocket pool on Neon). |
| `src/db/seed.ts`, `src/content/seed.ts`, `src/content/bburago.ts` | Starter catalogue and settings; Bburago photo URLs. |
| `src/lib/data.ts` | All **public reads**, tag-cached. Falls back to the starter content without a database. See [caching.md](caching.md). |
| `src/lib/pricing.ts` | Pure pricing logic, unit-tested. See [checkout.md](checkout.md). |
| `src/lib/orders.ts` | `placeOrder` and `setOrderStatus`: the transactional stock logic. |
| `src/lib/images.ts`, `media-store.ts`, `media-url.ts` | Upload pipeline, bucket client, public URL building. See [images.md](images.md). |
| `src/lib/auth.ts`, `credentials.ts`, `admin-path.ts` | Admin login, session cookie, `requireAdmin()`. |
| `src/app/actions/checkout.ts` | Public Server Actions: `quoteBag`, `submitOrder`. |
| `src/app/admin/actions.ts` | All **admin writes**. Each calls `requireAdmin()`, then `updateTag(...)`. |
| `src/app/sitemap.ts`, `robots.ts`, `manifest.ts`, `opengraph-image.png` | SEO files (the social card is a static image). See [seo.md](seo.md). |
| `scripts/*.ts` | CLI only (seed, migrate-on-deploy, dev DB check). Never bundled. |

## Rendered on the server, sent as HTML

| Path | Role |
|---|---|
| `src/app/(site)/**` | The storefront: home, shop, teams, drivers, accessories, products, checkout, order, info pages. |
| `src/app/admin/**/page.tsx`, `layout.tsx` | Admin screens. The folder is `admin`, the public URL is `ADMIN_PATH`. |
| `src/components/*.tsx` without `"use client"` | `chrome.tsx` (strip, footer, breadcrumbs), `ProductCard`, `Collection`, `Img`, `JsonLd`. |

## Runs in the browser

Only files starting with `"use client"`:

| File | Does |
|---|---|
| `components/bag.tsx` | Bag state in `localStorage`, slide-out drawer, "added" toast, quick-add buttons |
| `components/MegaNav.tsx` | Header, mega-menus, mobile menu, search box |
| `components/NewInTabs.tsx` | Home "New in" tabs (filters server-rendered cards) |
| `components/ProductBuy.tsx` | Product gallery and variant / quantity picker |
| `app/(site)/checkout/form.tsx` | Checkout form, live server quote |
| `app/admin/_components/*`, `app/admin/**/form.tsx`, `app/admin/media/client.tsx` | Admin forms, image picker, variants editor, confirm popovers |

They never import `@/db`, `@/lib/data`, `@/lib/auth` or `@/lib/admin-path`. `data.ts`, `auth.ts`, `orders.ts`, `images.ts` and `media-store.ts` import `server-only`, so a mistake fails the build.

## Rules of thumb

- A new public read goes in `src/lib/data.ts`, cached with the right tag.
- A new write is a Server Action. Call `requireAdmin()` first (the proxy alone isn't enough), then `updateTag` for every tag it affects.
- Never trust prices, stock or totals from the browser. Recompute on the server (`pricing.ts`).
- Never put a secret in a `NEXT_PUBLIC_*` variable or pass it as a prop to a client component.
