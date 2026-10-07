import Link from "next/link";
import { asc, count, eq } from "drizzle-orm";
import { db } from "@/db";
import { products, teams } from "@/db/schema";
import { ADMIN } from "@/lib/admin-path";
import { guard } from "../_lib";
import { DbNotice } from "../_nodb";
import { Empty, PageHeader, StatusPill, newBtn, td, th } from "../_components/ui";

export default async function TeamsAdmin() {
  await guard();
  const [rows, counts] = await Promise.all([
    db.select().from(teams).orderBy(asc(teams.sortOrder), asc(teams.name)),
    db.select({ id: products.teamId, n: count() }).from(products).where(eq(products.status, "active")).groupBy(products.teamId),
  ]);
  const base = `${ADMIN}/teams`;
  return (
    <>
      <DbNotice />
      <PageHeader actions={<Link href={`${base}/new`} className={newBtn}>New team</Link>}>Teams</PageHeader>
      {rows.length ? (
        <div className="overflow-x-auto rounded-[14px] border border-rule bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-rule"><tr><th className={th}>Team</th><th className={th}>Active products</th><th className={th}>Order</th><th className={th}>Status</th><th className={th}>Actions</th></tr></thead>
            <tbody>
              {rows.map((t) => (
                <tr key={t.id} className="border-b border-rule last:border-0 hover:bg-paper/60">
                  <td className={td}><Link href={`${base}/${t.id}`} className="flex items-center gap-3 font-semibold hover:text-red"><span className="h-6 w-1.5 rounded" style={{ background: t.color ?? "#111" }} />{t.name}</Link></td>
                  <td className={`${td} tabular-nums`}>{counts.find((c) => c.id === t.id)?.n ?? 0}</td>
                  <td className={`${td} font-mono text-xs text-ink-5`}>{t.sortOrder}</td>
                  <td className={td}><StatusPill live={t.published} /></td>
                  <td className={td}><Link href={`${base}/${t.id}`} className="text-xs font-semibold text-red hover:underline">Edit team</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty>No teams yet.</Empty>
      )}
    </>
  );
}
