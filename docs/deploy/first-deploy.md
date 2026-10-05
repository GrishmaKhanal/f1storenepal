# First deploy (any host)

The app needs three things: a Node host that runs Next.js 16, a Postgres database, and an S3-compatible bucket with a public CDN URL. For the concrete Vercel + Neon + R2 walkthrough see [vercel.md](vercel.md).

## In order

1. **Database.** Create a Postgres (Neon, Supabase, RDS, your own). Copy the connection string. If the provider has a pooled and a direct URL, the pooled one is `DATABASE_URL` and the direct one `DATABASE_URL_UNPOOLED`.
2. **Bucket.** Create a bucket, give it a public URL through a CDN or custom domain, and create an access key limited to that bucket (read + write).
3. **Host.** Connect the GitHub repo. Build command `npm run build`, start command `npm start` (serverless hosts handle this). Node 20+.
4. **Env vars.** Copy [`.env.production.example`](../../.env.production.example) and fill every value (reference: [env-vars.md](env-vars.md)). Set `RUN_MIGRATIONS=true` for production only.
5. **Deploy.** The build runs `drizzle-kit migrate`, then `next build`.
6. **Starter content.** Open `<SITE_URL><ADMIN_PATH>`, sign in, click **Import starter content** (once). It fetches the starter photos from `SITE_URL/assets/` and bburago.com and uploads them to the bucket.
7. **Check.** Run the eval table in the main README (product page 200, draft 404, `/admin` 404, a test order, cancel it).
8. **Domain.** Point the domain at the host, set `SITE_URL` to it, redeploy. Submit `/sitemap.xml` to Google Search Console.

## Host-specific notes

| Host | Notes |
|---|---|
| Vercel | See [vercel.md](vercel.md). The admin page allows 300 s for the starter import (`maxDuration`). |
| Netlify | Works as is with the Next.js runtime. Uploads need the bucket (no writable filesystem). |
| VPS / Docker (`next start`) | Any of the above. Without a bucket, `./.media` works on a single server with a persistent disk, but a bucket is still recommended. Put a reverse proxy (Caddy/Nginx) with HTTPS in front. |
