# Lights Out Nepal

Next.js 16 storefront for Lights Out Nepal ([Instagram](https://www.instagram.com/lightsoutnepal/)), selling F1 merch and diecast cars with delivery anywhere in Nepal. Shop by driver, team or accessory, guest checkout (no customer accounts), and a built-in admin at a secret URL set by `ADMIN_PATH`.

Everything on the site is edited in the admin: products, variants and stock, teams, drivers, categories, images, the hero, the announcement strip, delivery fees, payment methods and page copy. Orders land in the admin's **Orders** inbox.

**Docs:** [index](docs/README.md) · [admin guide](docs/admin-guide.md) · [architecture](docs/architecture/overview.md) · [deploy to Vercel + Neon + R2](docs/deploy/vercel.md) · [env vars and other hosts](docs/deploy/env-vars.md)

## Stack

| Piece | Choice | Swap it by |
|---|---|---|
| App | Next.js 16 (App Router), React 19, Tailwind 4 | — |
| Database | Postgres via Drizzle. Neon URLs use Neon's serverless driver, anything else uses node-postgres | changing `DATABASE_URL` |
| Images | Any S3-compatible bucket behind a CDN (Cloudflare R2 recommended). Local folder in dev | changing the `S3_*` vars and `MEDIA_PUBLIC_URL` |
| Admin auth | Username, password and session secret from env, JWT cookie | changing the env vars |

Nothing is tied to Vercel. The one Vercel package, `@vercel/analytics` (page views in `src/app/layout.tsx`), only reports on Vercel; remove it when moving hosts.

## Local dev

```sh
cp .env.example .env            # fill DATABASE_URL, ADMIN_PASSWORD, SESSION_SECRET (production template: .env.production.example)
npm ci
npm run db:migrate              # create tables
npm run db:seed                 # starter teams, drivers, categories, 12 products (9 Bburago cars with official photos), settings
npm run dev                     # site: http://localhost:3000, admin: http://localhost:3000$ADMIN_PATH
```

With no `S3_BUCKET`, uploads go to `./.media` (git-ignored) and are served by `/media/*`. With no `DATABASE_URL`, the site renders the starter content read-only.

| Command | Does |
|---|---|
| `npm test` | Unit tests, plus checkout and stock integration tests against a throwaway local Postgres database |
| `npm run lint` / `npm run typecheck` | ESLint / TypeScript |
| `npm run db:generate` | New migration after editing `src/db/schema.ts` |
| `npm run db:studio` | Browse the database |

## How content reaches search engines

- Public pages are prerendered HTML. Database reads are cached by tag (`src/lib/data.ts`) with no time-based expiry, so crawlers never wake the database.
- Every admin save calls `updateTag(...)`; the next visit regenerates the affected pages and `sitemap.xml`. No redeploy needed.
- Each product page has a canonical URL, title and description, Open Graph image (the product photo), `Product` + `Offer` JSON-LD (NPR price, in stock / sold out / pre-order) and breadcrumbs. Collections have `CollectionPage` + `ItemList`. The home page has `Store` JSON-LD (address from Location, `areaServed` Nepal plus the delivery towns, slogan, linked to Instagram) and a sitelinks `SearchAction`.
- The site is aimed at all of Nepal, not one town: the home page lists the delivery towns (Kathmandu, Pokhara, Chitwan…) and every page carries the admin's search phrases as meta keywords. No page names the town it ships from; the footer carries a short description instead of an address.
- Images are WebP at 480/960/1600 px with `srcset`, real `width`/`height` (no layout shift) and required alt text. Fonts are self-hosted by `next/font`.
- Checkout, order and search pages are `noindex`. The admin sends `X-Robots-Tag: noindex` and isn't listed in `robots.txt`.
- Don't change a product's slug after it's live: it breaks links and search history.

## Evaluation & Improvement

- **Success metric:** orders placed through the site per month (admin dashboard, "Orders this month"), excluding cancelled. The leading proxy is organic clicks to `/products/*` in Google Search Console.
- **Eval:** after each deploy, check these against the live site, `/sitemap.xml` and Search Console URL Inspection:

  | Check | Expected |
  |---|---|
  | an active product URL | 200, in sitemap, `Product` rich result valid |
  | a draft or archived product URL | 404, absent from sitemap |
  | edit a product's price in admin, reload its page | new price shown; `lastmod` updated in sitemap |
  | set a variant's stock to 0 | "Sold out" on card and page, JSON-LD `OutOfStock` |
  | place an order for the last unit, then try again | first succeeds, second is told "Sold out" |
  | cancel that order in admin | stock goes back up by the ordered quantity |
  | `$ADMIN_PATH` | login form, `X-Robots-Tag: noindex` |
  | `/admin` | 404 |
  | `/checkout`, `/order/<token>` | `noindex` |
  | home page source | `<meta name="keywords">` with the search phrases; `Store` JSON-LD with `areaServed` towns and `slogan` |

  Local run 2026-10-05 (local Postgres, seeded): all rows pass except "Rich result valid" and indexing, which need the deployed site and Search Console. The order, stock and cancel rows are also covered by `test/db.integration.test.ts` (4/4 pass).
- **Feedback capture:** every order and its status (new → confirmed → paid → shipped → delivered / cancelled) is stored in `orders`. Cancelled orders and the private admin note record why sales fall through. Search performance comes from Search Console.
- **Review loop:** monthly. Review order count and cancellation rate on the dashboard, Search Console coverage and top queries, and stock alerts. Update the eval table when routes change.
