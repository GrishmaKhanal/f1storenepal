import "server-only";
import { randomBytes } from "node:crypto";
import sharp from "sharp";
import { MAX_IMAGE_BYTES, sniffImageType } from "./image-type";
import { mediaFile } from "./media-url";
import { put, remove } from "./media-store";

// Every upload is stored as WebP at these widths (never upscaled), so pages can send
// a srcset and the host never has to resize images on request.
export const WIDTHS = [480, 960, 1600];

export type Processed = { storageKey: string; width: number; height: number; widths: number[]; bytes: number };

export async function processAndStore(input: Buffer, folder = "media"): Promise<Processed> {
  if (input.byteLength > MAX_IMAGE_BYTES) throw new UploadError("Image is over 4 MB.");
  if (!sniffImageType(input)) throw new UploadError("Use a PNG, JPEG, WebP, GIF or AVIF image.");

  const img = sharp(input, { failOn: "error" }).rotate(); // apply EXIF orientation
  const meta = await img.metadata();
  const srcW = meta.autoOrient?.width ?? meta.width ?? 0;
  const srcH = meta.autoOrient?.height ?? meta.height ?? 0;
  if (!srcW || !srcH) throw new UploadError("Couldn't read the image dimensions.");

  const widths = WIDTHS.filter((w) => w < srcW);
  if (widths.length < WIDTHS.length) widths.push(Math.min(srcW, WIDTHS[WIDTHS.length - 1]));
  const unique = [...new Set(widths)].sort((a, b) => a - b);

  const storageKey = `${folder}/${randomBytes(9).toString("base64url")}`;
  const written: string[] = [];
  let bytes = 0;
  try {
    for (const w of unique) {
      const buf = await img.clone().resize({ width: w, withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
      const key = mediaFile(storageKey, w);
      await put(key, buf, "image/webp");
      written.push(key);
      bytes += buf.byteLength;
    }
  } catch (e) {
    await remove(written).catch(() => {});
    throw e;
  }
  return { storageKey, width: srcW, height: srcH, widths: unique, bytes };
}

export async function deleteStored(m: { storageKey: string; widths: number[] }) {
  await remove(m.widths.map((w) => mediaFile(m.storageKey, w)));
}

export class UploadError extends Error {}
