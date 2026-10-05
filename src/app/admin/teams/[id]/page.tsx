import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { teams } from "@/db/schema";
import { ADMIN } from "@/lib/admin-path";
import { guard, isCreated, library, mediaByIds } from "../../_lib";
import { PageHeader } from "../../_components/ui";
import { TeamForm } from "../../_components/catalog-forms";

export default async function TeamEdit({ params, searchParams }: PageProps<"/admin/teams/[id]">) {
  await guard();
  const { id } = await params;
  const team = id === "new" ? null : await db.query.teams.findFirst({ where: eq(teams.id, Number(id) || 0) });
  if (id !== "new" && !team) notFound();
  const [lib, ms] = await Promise.all([library(), mediaByIds([team?.logoId ?? null])]);
  return (
    <>
      <PageHeader back={["Teams", `${ADMIN}/teams`]}>{team?.name ?? "New team"}</PageHeader>
      <TeamForm team={team ?? null} logo={team?.logoId ? (ms.get(team.logoId) ?? null) : null} library={lib} created={await isCreated(searchParams)} />
    </>
  );
}
