# Migrations

Drizzle Kit **generated migrations**: edit `src/db/schema.ts`, Drizzle writes SQL into `drizzle/`, you commit it, production applies it on deploy. Don't use `drizzle-kit push` against production: it keeps no history and can't be reviewed.

## The loop

```sh
$EDITOR src/db/schema.ts                         # 1. edit the schema
npm run db:generate -- --name add_product_weight  # 2. writes drizzle/0001_add_product_weight.sql
cat drizzle/0001_add_product_weight.sql           # 3. read it: DROP? NOT NULL without DEFAULT? enum changes?
npm run db:migrate && npm run dev                 # 4. apply locally, try it
git add src/db/schema.ts drizzle/                 # 5. commit schema + SQL together
git commit -m "Add product weight"
git push                                          # 6. production build migrates first (RUN_MIGRATIONS=true)
```

## What runs where

| Environment | Who migrates | How |
|---|---|---|
| Local | you | `npm run db:migrate` (`npm run dev` warns if any are pending) |
| Production | the build, when `RUN_MIGRATIONS=true` | `npm run build` → `scripts/migrate-on-deploy.ts` → `drizzle-kit migrate` → `next build` |
| Previews | skipped | leave `RUN_MIGRATIONS` unset unless previews have their own database (Neon branches work well) |

Migrations use `DATABASE_URL_UNPOOLED` when it's set (Neon's direct connection), else `DATABASE_URL`.

## Rules that keep deploys safe

The new code and the old code both run against the database for a moment during a deploy, so:

1. **Additive first.** Add columns as nullable or with a default. Backfill. Only later make them `NOT NULL`.
2. **Never rename or drop in one step.** Add the new column → ship code that writes both → backfill → ship code that reads the new one → drop the old one in a later migration.
3. **Enum values:** adding is fine; removing or renaming needs the two-step dance above.
4. **Don't edit a migration that's already been applied anywhere.** Write a new one.
5. Back up first for anything destructive (Neon: create a branch, which is an instant copy).
