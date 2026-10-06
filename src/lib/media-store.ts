import "server-only";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { DeleteObjectsCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

// All bucket access goes through this module, so the provider is an env change:
// Cloudflare R2, AWS S3, Backblaze B2, MinIO, Supabase Storage... anything S3-compatible.
// With no S3_BUCKET set (local dev), files go to ./.media and /media/* serves them.

const bucket = process.env.S3_BUCKET;
export const usesBucket = Boolean(bucket);
export const LOCAL_DIR = path.join(process.cwd(), ".media");

// R2's dashboard shows the endpoint with the bucket on the end (".../my-bucket"). With
// path-style addressing that would nest every key under "my-bucket/", so strip it.
const endpoint = process.env.S3_ENDPOINT?.replace(/\/+$/, "").replace(new RegExp(`/${bucket}$`), "") || undefined;

let client: S3Client | null = null;
function s3() {
  client ??= new S3Client({
    region: process.env.S3_REGION || "auto",
    endpoint,
    // R2 and MinIO want path-style addressing; S3 accepts it too.
    forcePathStyle: Boolean(endpoint),
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID ?? "",
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "",
    },
  });
  return client;
}

export function canWrite(): string | null {
  if (usesBucket) return null;
  // Serverless hosts have a read-only filesystem; local files would vanish anyway.
  if (process.env.VERCEL || process.env.NETLIFY) {
    return "Image storage isn't configured. Set S3_BUCKET and the other S3_* variables (see docs/deploy/env-vars.md).";
  }
  return null;
}

export async function put(key: string, body: Buffer, contentType: string) {
  if (usesBucket) {
    await s3().send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
        // Keys are never reused, so the CDN and browsers may keep them forever.
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );
    return;
  }
  const file = path.join(LOCAL_DIR, key);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, body);
}

export async function remove(keys: string[]) {
  if (!keys.length) return;
  if (usesBucket) {
    await s3().send(new DeleteObjectsCommand({ Bucket: bucket, Delete: { Objects: keys.map((Key) => ({ Key })) } }));
    return;
  }
  await Promise.all(keys.map((k) => rm(path.join(LOCAL_DIR, k), { force: true })));
}
