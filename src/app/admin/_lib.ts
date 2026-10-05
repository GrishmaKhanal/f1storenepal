import "server-only";
import { desc, inArray } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { media, type Media } from "@/db/schema";
import { isAdmin } from "@/lib/auth";
import { ADMIN } from "@/lib/admin-path";
import { mediaUrl } from "@/lib/media-url";
import type { MediaLite } from "./_components/fields";

/** Page-level guard (the proxy also guards, this is defence in depth). */
export async function guard() {
  if (!(await isAdmin())) redirect(ADMIN);
}

export const lite = (m: Media): MediaLite => ({ id: m.id, src: mediaUrl(m, 480), alt: m.alt, name: m.name });

/** Every image, newest first, for the pickers. Fine for a shop-sized library. */
export async function library() {
  return (await db.select().from(media).orderBy(desc(media.createdAt)).limit(500)).map(lite);
}

export async function mediaByIds(ids: (number | null)[]) {
  const clean = ids.filter((x): x is number => x != null);
  if (!clean.length) return new Map<number, MediaLite>();
  const rows = await db.select().from(media).where(inArray(media.id, clean));
  return new Map(rows.map((m) => [m.id, lite(m)]));
}

/** "?created=1" after the first save of a new item. */
export const isCreated = async (sp: Promise<Record<string, string | string[] | undefined>>) => (await sp).created === "1";
