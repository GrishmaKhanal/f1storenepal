# HTTP routes and Server Actions

There is no JSON API: pages are HTML, a few routes return files, and all writes are Server Actions. "Static" means prerendered and cached until an admin save expires its tag (see [caching.md](caching.md)).

## Public pages

| Path | Source | Notes |
|---|---|---|
| `/` | `src/app/(site)/page.tsx` | Hero, shop by team, featured drivers, New in tabs, accessories, steps, Instagram band. `Store` + `WebSite` JSON-LD. Static. |
| `/shop` | `(site)/shop/page.tsx` | All active products. `?cat=`, `?team=`, `?sort=`, `?stock=1` filters; canonical is always `/shop`. Rendered per request from cached data. |
| `/new` | `(site)/new/page.tsx` | Newest 48 by publish date. Static. |
| `/teams`, `/teams/<slug>` | `(site)/teams/…` | Team list; a team's products. `CollectionPage` JSON-LD. Static; new slugs render on first visit. |
| `/drivers`, `/drivers/<slug>` | `(site)/drivers/…` | Same for drivers. |
| `/accessories`, `/accessories/<slug>` | `(site)/accessories/…` | Accessory categories; any category's products (diecast too). |
| `/products/<slug>` | `(site)/products/[slug]/page.tsx` | Active products only, else 404. `Product` + `Offer`/`AggregateOffer` and breadcrumb JSON-LD. Static. |
| `/search?q=` | `(site)/search/page.tsx` | Name, team, driver, number, category, brand. `noindex`. |
| `/checkout` | `(site)/checkout/page.tsx` | Guest checkout form. `noindex`, disallowed in robots. |
| `/order/<token>` | `(site)/order/[token]/page.tsx` | Order confirmation by unguessable token. Shows items and totals, never address or phone. Dynamic, `noindex`. |
| `/delivery`, `/returns`, `/contact` | `(site)/…` | Copy from Site content. Static. |

## Files and metadata

| Path | Source | Notes |
|---|---|---|
| `/sitemap.xml` | `src/app/sitemap.ts` | Static pages, every active product (with up to 3 image URLs), and teams/drivers/categories that have products. |
| `/robots.txt` | `src/app/robots.ts` | Allows all except `/checkout`, `/order/`, `/search`. Deliberately doesn't list `ADMIN_PATH`. |
| `/manifest.webmanifest` | `src/app/manifest.ts` | Web app manifest. |
| `/opengraph-image.png` | `src/app/opengraph-image.png` | Default 1200×630 social card, a static file (alt text in `opengraph-image.alt.txt`). Replace the PNG to change it. Product pages use their own photo. |
| `/media/<key>-<w>.webp` | `src/app/media/[...key]/route.ts` | **Local dev only**: serves `./.media`. Returns 404 when `S3_BUCKET` is set (images come from `MEDIA_PUBLIC_URL`). |
| `/icon.png`, `/apple-icon.png`, `/icons/*`, `/assets/*` | `src/app/*`, `public/` | Static files. The proxy skips these. |

## Admin (under `ADMIN_PATH`)

All rewritten by the proxy to `src/app/admin/*`, `noindex`, `no-store`. Everything except the root needs a session.

| Path | Screen |
|---|---|
| `$ADMIN_PATH` | Login form, or the dashboard |
| `/orders`, `/orders/<id>` | Order list (status filters), order detail and status |
| `/products`, `/products/new`, `/products/<id>` | Product list (quick stock edit), editor |
| `/teams…`, `/drivers…`, `/categories…` | Lists and editors |
| `/media` | Image library |
| `/settings` | Site content |
| `/admin`, `/admin/*` | **Always 404**, even signed in |

## Server Actions

| Action | File | Who | Does |
|---|---|---|---|
| `quoteBag` | `app/actions/checkout.ts` | public | Prices a bag from the DB for the checkout page |
| `submitOrder` | `app/actions/checkout.ts` | public | Validates, then `placeOrder` (transaction); honeypot field |
| `login`, `logout` | `app/admin/actions.ts` | public / admin | Sets or clears the session cookie (800 ms delay on failure) |
| `uploadImage`, `saveMedia`, `deleteMedia` | admin | admin | Upload pipeline; alt/name edit; delete (refused while used) |
| `saveProduct`, `deleteProduct`, `setStock` | admin | admin | Product with variants and images; quick stock edit |
| `saveTeam/Driver/Category`, `deleteTeam/Driver/Category` | admin | admin | Catalogue editors |
| `updateOrder`, `deleteOrder` | admin | admin | Status (cancel returns stock), private note; delete |
| `saveSettings` | admin | admin | Site content |
| `importStarterContent`, `refreshPublicPages` | admin | admin | One-time seed; expire every cache tag |

Every admin action calls `requireAdmin()` itself, so a proxy mistake can't expose writes.
