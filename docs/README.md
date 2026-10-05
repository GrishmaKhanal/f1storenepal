# Docs

How the F1 Store Nepal site is built, how data moves through it, and how to run and ship it.

| Folder | Read it when you want to… |
|---|---|
| [`admin-guide.md`](admin-guide.md) | run the store day to day: add products, manage stock, handle orders |
| [`architecture/`](architecture/) | understand where the "frontend" ends and the "backend" begins, and why |
| [`database/`](database/) | change a table, write a migration, or reset your local DB |
| [`deploy/`](deploy/) | put the site online the first time, change hosts, or ship a change safely |

## Map

- [admin-guide.md](admin-guide.md): the store owner's guide to the admin
- **architecture/**
  - [overview.md](architecture/overview.md): one app, not a separate API (and why), file by file
  - [http-routes.md](architecture/http-routes.md): every URL and Server Action, and who can call it
  - [admin-and-auth.md](architecture/admin-and-auth.md): the secret admin URL (`ADMIN_PATH`), login, sessions
  - [caching.md](architecture/caching.md): how an admin edit reaches the public site without a redeploy
  - [images.md](architecture/images.md): why images live in a bucket behind a CDN, and the upload pipeline
  - [checkout.md](architecture/checkout.md): bag, pricing, stock and orders
  - [seo.md](architecture/seo.md): what each page sends to search engines
- **database/**
  - [schema.md](database/schema.md): the ten tables and what each holds
  - [migrations.md](database/migrations.md): the migration workflow and the rules that keep deploys safe
  - [local-dev.md](database/local-dev.md): local Postgres, seeding, resetting
- **deploy/**
  - [env-vars.md](deploy/env-vars.md): every environment variable, and what to change to move hosts
  - [vercel.md](deploy/vercel.md): **Vercel + Neon + Cloudflare R2**, step by step
  - [first-deploy.md](deploy/first-deploy.md): the same for any host
  - [releasing.md](deploy/releasing.md): the everyday ship loop, previews, rollback
- [superpowers/specs/](superpowers/specs/): the original design decisions

## Cheat sheet

```sh
npm run dev            # checks the DB is up, then site at :3000, admin at :3000$ADMIN_PATH
npm test               # unit + integration tests (see below)
npm run lint           # ESLint
npm run typecheck      # TypeScript
npm run db:generate    # schema.ts changed → write a new SQL migration into drizzle/
npm run db:migrate     # apply pending migrations to $DATABASE_URL
npm run db:seed        # starter catalogue and settings (idempotent; downloads Bburago photos)
npm run db:studio      # browse the DB in a web UI
git push               # host builds; with RUN_MIGRATIONS=true (production) the build migrates first
```

## Tests

`npm test` runs Node's built-in test runner (through `tsx`, with the `react-server` condition so `server-only` modules load) over `test/*.test.ts`:

| File | Covers |
|---|---|
| `pricing.test.ts` | Bag normalising (merge, clamp to 10, drop junk), server-side pricing, sold-out / short-stock / unpriced / inactive flags, delivery fees and the free-delivery threshold |
| `slug-money.test.ts` | Slugs (accents, punctuation), rupee formatting with Indian grouping, order numbers, media URL and `srcset` building |
| `credentials.test.ts` | Admin username/password check: case rules, wrong values, login disabled when env vars are missing |
| `admin-routing.test.ts` | `ADMIN_PATH` parsing; the proxy's rewrite, 404, login redirect and session checks |
| `image-type.test.ts` | Uploads identified by their bytes: PNG/JPEG/GIF/WebP/AVIF accepted; SVG, HTML and renamed files rejected |
| `db.integration.test.ts` | Creates a throwaway database beside your local one, runs the real migrations and seed (local photos only, no network), then: checkout takes stock and prices from the DB; three customers racing for two units → exactly two orders; cancel returns stock and un-cancel takes it again; bad zone/payment rejected without touching stock. Drops the database afterwards and **skips** when no local Postgres is reachable. Never runs against Neon. |
