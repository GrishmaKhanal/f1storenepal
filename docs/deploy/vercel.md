# Deploy: Vercel + Neon + Cloudflare R2

Check each provider's current free-tier limits before you start; they change.

## 1. Database (Neon)

1. In Vercel: **Storage → Create → Neon** (or create a project at neon.tech). Pick the region closest to your Vercel functions (for Nepal, Singapore `ap-southeast-1` pairs with Vercel `sin1`).
2. Connect it to the project for **Production** (and Preview if you want previews to have data). The integration adds `DATABASE_URL` and `DATABASE_URL_UNPOOLED`. Check they're there under **Settings → Environment Variables**.

## 2. Images (Cloudflare R2)

1. Cloudflare dashboard → **R2 → Create bucket**, e.g. `f1storenepal-media`.
2. Bucket → **Settings → Public access → Custom domain**: connect `img.<your-domain>` (the domain's DNS must be on Cloudflare). For a quick test you can enable the `r2.dev` URL, but it's rate-limited and not for production.
3. **R2 → Manage API tokens → Create token**: permission *Object Read & Write*, scoped to this bucket only. Note the access key ID, the secret, and the S3 endpoint `https://<account-id>.r2.cloudflarestorage.com`.

## 3. Vercel project

1. **Add New → Project →** import `GrishmaKhanal/f1storenepal`. Framework preset: Next.js. Build command: default (`npm run build`).
2. Environment variables (see [env-vars.md](env-vars.md)):
   - Production only: `RUN_MIGRATIONS=true`
   - All: `ADMIN_PATH`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `SESSION_SECRET`, `SITE_URL`
   - All: `S3_ENDPOINT`, `S3_REGION=auto`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `MEDIA_PUBLIC_URL=https://img.<your-domain>`
3. Optional: **Settings → Functions → Region** to match Neon (e.g. `sin1`). Only cache misses hit the database, so this mostly speeds up the admin and checkout.
4. Deploy. The build applies `drizzle/*.sql` before `next build`.

## 4. First run

1. Open `https://<site><ADMIN_PATH>`, sign in, and click **Import starter content**. It loads the teams, drivers, categories, sample products and settings, and uploads the product photos to R2: two from `SITE_URL/assets/` (so `SITE_URL` must be right) and 44 official Bburago photos from bburago.com (`src/content/bburago.ts`). Photos that fail to download are skipped; add them later in the admin.
2. Replace the sample products with real ones and add photos.
3. **Site content:** check the location, Instagram link, delivery fees and payment methods.

## 5. Domain and search

1. Vercel → **Settings → Domains**: add your domain. Set `SITE_URL` to it and redeploy.
2. Google Search Console: add the domain, submit `https://<domain>/sitemap.xml`, and run URL Inspection on a product page to confirm the Product rich result.
3. Link the site from the Instagram bio.

## Releasing

Work on `develop`, merge to `main` to deploy production. Schema changes: edit `src/db/schema.ts`, run `npm run db:generate`, commit the new `drizzle/*.sql`. The production build applies it.
