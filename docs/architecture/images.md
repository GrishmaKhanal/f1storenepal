# Images

## Decision: bucket + CDN for bytes, Postgres for metadata

| Option | Verdict |
|---|---|
| Bytes in Postgres (base64) | ✗ About a third larger than the file, eats the free-tier storage cap, and every image view runs a function and a DB read. |
| Serve through the app from a bucket | ✗ Every CDN miss still runs a function. |
| **Public bucket behind a CDN, key + metadata in Postgres** | ✓ Image traffic never touches the app or the database. Swapping providers is an env change. |

Cloudflare R2 is recommended: no download (egress) fees, Cloudflare's CDN in front. Any S3-compatible store works with the same code (AWS S3 + CloudFront, Backblaze B2, MinIO, Supabase Storage).

## Upload pipeline

`uploadImage` (admin Server Action) → `processAndStore` in `src/lib/images.ts`:

1. Reject over 4 MB (`MAX_IMAGE_BYTES`; Vercel caps request bodies at 4.5 MB).
2. Identify the type from the **bytes**, never the file name (`sniffImageType`). SVG is refused (it can carry script).
3. `sharp`: apply EXIF rotation, read width/height, write **WebP at 480, 960 and 1600 px** (never upscaled; small originals get fewer sizes).
4. `PUT` each file to `<folder>/<random key>-<width>.webp` with `Cache-Control: public, max-age=31536000, immutable`. If any write fails, the ones already written are deleted.
5. Insert a `media` row: `storage_key`, `widths`, `width`, `height`, `bytes`, `name`, `alt`. If the insert fails, the files are deleted. Nothing is orphaned.

The browser never sees bucket credentials.

## Display

`src/lib/media-url.ts` builds `MEDIA_PUBLIC_URL/<key>-<w>.webp`; `toImg()` in `data.ts` turns a row into `{ src (960), large (1600), srcSet, width, height, alt }`. `components/Img.tsx` renders responsive plain `<img>` elements with `srcset`, `sizes`, real dimensions (no layout shift), lazy loading except above the fold, and high fetch priority for hero images. `Gallery` in `components/ProductBuy.tsx` shows one responsive slide at a time, preloads the next at low priority, and supports touch/arrow/keyboard navigation.

`next/image` optimisation is **not** used: the sizes already exist, and on Vercel it would be billed per image.

## Local dev

With `S3_BUCKET` empty, `media-store.ts` writes to `./.media` (git-ignored) and `/media/[...key]` serves it. On Vercel/Netlify without a bucket, uploads are refused with a clear message (their filesystem is read-only).

## Rules

- Rows store the **key**, never a full URL. Changing domain or provider = change `MEDIA_PUBLIC_URL`, copy the bucket. No row rewrites.
- Keys are never reused, which is what makes `immutable` safe. Renaming or editing alt text never moves the file.
- Alt text is required (prefilled from the file name). Edit it in **Media**; product galleries use it everywhere.
- Deleting an image is refused while a product, team logo, driver portrait or the hero uses it.

## Starter photos

`npm run db:seed` / **Import starter content** loads two photos from `public/assets/` and 44 official Bburago product photos listed in `src/content/bburago.ts`, downloaded from bburago.com (4 at a time, 20 s timeout each; failures are skipped, not fatal). Confirm with your supplier that you may use manufacturer photos for products you resell.
