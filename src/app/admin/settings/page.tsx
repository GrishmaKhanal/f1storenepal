import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { products, settings } from "@/db/schema";
import { defaultSettings } from "@/content/seed";
import { guard, library, mediaByIds } from "../_lib";
import { DbNotice } from "../_nodb";
import { PageHeader } from "../_components/ui";
import { SettingsForm } from "./form";

export default async function SettingsAdmin() {
  await guard();
  const [row] = await db.select().from(settings).where(eq(settings.key, "site"));
  const s = { ...defaultSettings, ...(row?.value ?? {}) };
  const [lib, ms, ps] = await Promise.all([library(), mediaByIds([s.heroImageId]), db.select({ id: products.id, name: products.name }).from(products).orderBy(asc(products.name))]);
  return (
    <>
      <DbNotice />
      <PageHeader>Site content</PageHeader>
      <SettingsForm s={s} heroImage={s.heroImageId ? (ms.get(s.heroImageId) ?? null) : null} library={lib} products={ps.map((p) => [p.id, p.name])} />
    </>
  );
}
