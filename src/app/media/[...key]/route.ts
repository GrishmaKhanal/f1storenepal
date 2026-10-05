import { readFile } from "node:fs/promises";
import path from "node:path";
import { LOCAL_DIR, usesBucket } from "@/lib/media-store";

// Local-dev image server. In production images come straight from the bucket's CDN
// (MEDIA_PUBLIC_URL) and this route is never hit.
export async function GET(_: Request, ctx: RouteContext<"/media/[...key]">) {
  const { key } = await ctx.params;
  const rel = key.join("/");
  if (usesBucket || !/^[A-Za-z0-9_/-]+-\d+\.webp$/.test(rel) || rel.includes("..")) return new Response("Not found", { status: 404 });
  try {
    const body = await readFile(path.join(LOCAL_DIR, rel));
    return new Response(body, { headers: { "Content-Type": "image/webp", "Cache-Control": "public, max-age=31536000, immutable" } });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
