// Builds public image URLs from a media row. Safe to import anywhere: it only reads
// MEDIA_PUBLIC_URL (not secret). Server components call it and pass strings down.
const ORIGIN = (process.env.MEDIA_PUBLIC_URL || "").replace(/\/$/, "");
const BASE = process.env.S3_BUCKET && ORIGIN ? ORIGIN : "/media";

export type MediaRef = { storageKey: string; widths: number[]; width: number; height: number; alt: string };

export const mediaFile = (key: string, w: number) => `${key}-${w}.webp`;

export const mediaUrl = (m: Pick<MediaRef, "storageKey" | "widths">, maxW = Infinity) => {
  const w = m.widths.filter((x) => x <= maxW).at(-1) ?? m.widths[0];
  return `${BASE}/${mediaFile(m.storageKey, w)}`;
};

export const mediaSrcSet = (m: Pick<MediaRef, "storageKey" | "widths">) =>
  m.widths.map((w) => `${BASE}/${mediaFile(m.storageKey, w)} ${w}w`).join(", ");
