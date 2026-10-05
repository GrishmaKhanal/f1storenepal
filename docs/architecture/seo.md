# SEO

| Where | What |
|---|---|
| Every page | Server-rendered HTML; `generateMetadata` title (`%s | F1 Store Nepal`) and description; **per-page canonical** (never global); Open Graph and Twitter card; `lang="en-NP"` |
| Home | `Store` JSON-LD (name, logo, address from Location, `areaServed` Nepal, payment methods, `sameAs` Instagram) and `WebSite` with a `SearchAction` |
| Product | `Product` JSON-LD with `Offer` (or `AggregateOffer` when variants have different prices): NPR price, `InStock` / `OutOfStock` / `PreOrder` (badge "Pre-order"), new condition, seller = the store. OG image = the product's 1600 px photo. Breadcrumbs. |
| Team, driver, category, New in | `CollectionPage` + `ItemList` of product URLs; breadcrumbs; generated titles like "Ferrari F1 merchandise and diecast cars" unless an SEO title is set |
| Shop | Filters are query strings with `rel="nofollow"`; canonical is `/shop` |
| Search, checkout, order | `noindex` (checkout and order also disallowed in `robots.txt`) |
| Admin | `X-Robots-Tag: noindex, nofollow`; not in `robots.txt` (that would advertise it) |
| `sitemap.xml` | Static pages, all active products with image URLs, collections with products; `lastmod` from `updated_at` |

Every product, team, driver and category has optional **SEO title** (60 chars) and **SEO description** (160 chars) fields with live counters in the admin.

## Performance (Core Web Vitals)

- Pages are prerendered; the database isn't on the request path.
- Images: WebP `srcset`, explicit `width`/`height`, lazy below the fold, `fetchpriority="high"` for the hero and main product photo.
- Fonts self-hosted by `next/font` (Barlow Condensed, DM Sans, JetBrains Mono): no third-party request, no layout shift.
- Client JS is limited to the bag, menus, tabs, product picker and checkout.
- Animations respect `prefers-reduced-motion`.

## After launch

1. Set `SITE_URL` to the real domain and redeploy (canonicals and the sitemap use it).
2. Google Search Console: verify the domain, submit `/sitemap.xml`.
3. URL Inspection on a product page → confirm the Product rich result.
4. Put the site link in the Instagram bio.
5. Don't rename slugs of live products; it breaks links and search history.
