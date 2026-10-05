# F1 Store Nepal: design

Date: 2026-10-05. Status: built (see README and docs/architecture.md for the as-built detail).

## Goal

An SEO-first storefront for @f1storenepal (Jhapa, Nepal) from the Claude Design homepage: shop by driver, team or accessory, guest checkout, Instagram as a first-class ordering channel, and an admin at a secret env-configured URL where every piece of site content, catalogue data and stock count is editable.

## Decisions

| Question | Decision |
|---|---|
| Structure | Mirror `claude-design-portfolio`: Next.js 16, Drizzle and Postgres, tag-cached public reads in `lib/data.ts`, admin writes as Server Actions behind `requireAdmin()`, admin hidden at `ADMIN_PATH` via `proxy.ts`. |
| Ordering | Guest checkout form. Order stored in DB, stock decremented in a transaction, payment manual (COD, eSewa, Khalti, bank), confirmed by phone. "DM on Instagram" offered everywhere. No customer login. |
| Images | Object storage + CDN (R2 recommended), metadata and key in Postgres, WebP at 3 widths made on upload. Local folder in dev. |
| Hosting | Vercel + Neon now; portable by env vars (any Postgres, any S3-compatible bucket, any Node host). |
| Variants | Every product has ≥1 variant; each has its own stock (null = untracked) and optional price. |
| Optional fields | Every settings and catalogue field is nullable; empty hides the section. |
| Counts | Team, driver and category counts are computed from active products, never typed in. |
| Location | Jhapa, Nepal in footer, Contact and `Store` JSON-LD. |

## Out of scope (for now)

Customer accounts, online payment gateways, discount codes, multi-admin users, reviews.
