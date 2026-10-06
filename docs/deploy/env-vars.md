# Environment variables

Set them in `.env` locally, and in your host's settings in production. Secrets are never `NEXT_PUBLIC_*` and never reach the browser.

Templates in the repo root:

| File | For |
|---|---|
| [`.env.example`](../../.env.example) | local dev: `cp .env.example .env` |
| [`.env.production.example`](../../.env.production.example) | production (Vercel + Neon + R2 shape): paste each key into the host's settings. Never create a real `.env.production` file in the repo. |

Generate the secrets:

```sh
echo "ADMIN_PATH=/pit-$(openssl rand -hex 4)"
echo "ADMIN_PASSWORD=$(openssl rand -base64 24)"
echo "SESSION_SECRET=$(openssl rand -base64 48)"
```

| Variable | Secret | Needed | Notes |
|---|---|---|---|
| `DATABASE_URL` | yes | production | Any Postgres URL. Neon (`*.neon.tech`) uses the serverless driver, anything else node-postgres. |
| `DATABASE_URL_UNPOOLED` | yes | optional | Direct URL used only by migrations. |
| `RUN_MIGRATIONS` | no | production only | `true` makes `npm run build` apply pending migrations. Leave unset on previews that share the production DB. |
| `ADMIN_PATH` | treat as secret | yes | e.g. `/pit-$(openssl rand -hex 4)`. Empty disables the admin. Avoid `/admin`, `/login`, `/dashboard`. |
| `ADMIN_USERNAME` | yes | yes | Case-insensitive. |
| `ADMIN_PASSWORD` | yes | yes | Long and random. |
| `SESSION_SECRET` | yes | yes | 32+ chars: `openssl rand -base64 48`. Rotating it logs everyone out. |
| `SITE_URL` | no | yes | Public origin, e.g. `https://f1storenepal.com`. Used in canonical URLs, sitemap, JSON-LD and OG tags. Redeploy after changing it. |
| `S3_BUCKET` | no | production | Empty = local `./.media` folder (dev only; serverless hosts refuse uploads). |
| `S3_ENDPOINT` | no | for non-AWS | R2: `https://<account-id>.r2.cloudflarestorage.com`, without the `/<bucket>` the dashboard adds. Empty for AWS S3. |
| `S3_REGION` | no | yes | `auto` for R2, e.g. `ap-south-1` for AWS. |
| `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` | yes | production | A key scoped to this one bucket, read and write. |
| `MEDIA_PUBLIC_URL` | no | production | Public CDN origin for the bucket, no trailing slash, e.g. `https://img.f1storenepal.com`. |

## Moving hosts

| Move to | Change |
|---|---|
| Netlify, Render, Railway, a VPS (`npm run build && npm start`) | Nothing in code. Copy the env vars. |
| Supabase, RDS or self-hosted Postgres | `DATABASE_URL` (and `DATABASE_URL_UNPOOLED`). Run `npm run db:migrate` once, or deploy with `RUN_MIGRATIONS=true`. |
| AWS S3 + CloudFront | `S3_ENDPOINT` empty, `S3_REGION`, the keys, `MEDIA_PUBLIC_URL` = the CloudFront domain. Copy the bucket's objects across (keys stay the same). |
| Backblaze B2, MinIO, Supabase Storage | `S3_ENDPOINT`, `S3_REGION`, keys, `MEDIA_PUBLIC_URL`. |

Image rows store keys, not URLs, so switching image hosts never rewrites the database.
