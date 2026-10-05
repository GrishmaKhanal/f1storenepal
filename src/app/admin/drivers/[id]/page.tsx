import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { drivers, teams } from "@/db/schema";
import { ADMIN } from "@/lib/admin-path";
import { guard, isCreated, library, mediaByIds } from "../../_lib";
import { PageHeader } from "../../_components/ui";
import { DriverForm } from "../../_components/catalog-forms";

export default async function DriverEdit({ params, searchParams }: PageProps<"/admin/drivers/[id]">) {
  await guard();
  const { id } = await params;
  const driver = id === "new" ? null : await db.query.drivers.findFirst({ where: eq(drivers.id, Number(id) || 0) });
  if (id !== "new" && !driver) notFound();
  const [lib, ms, ts] = await Promise.all([library(), mediaByIds([driver?.portraitId ?? null]), db.select({ id: teams.id, name: teams.name }).from(teams).orderBy(asc(teams.sortOrder))]);
  return (
    <>
      <PageHeader back={["Drivers", `${ADMIN}/drivers`]}>{driver?.name ?? "New driver"}</PageHeader>
      <DriverForm driver={driver ?? null} portrait={driver?.portraitId ? (ms.get(driver.portraitId) ?? null) : null} library={lib} teams={ts.map((t) => [t.id, t.name])} created={await isCreated(searchParams)} />
    </>
  );
}
