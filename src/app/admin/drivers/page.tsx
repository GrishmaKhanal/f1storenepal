import Link from "next/link";
import { asc, count, eq } from "drizzle-orm";
import { db } from "@/db";
import { drivers, products, teams } from "@/db/schema";
import { ADMIN } from "@/lib/admin-path";
import { guard } from "../_lib";
import { DbNotice } from "../_nodb";
import { Empty, PageHeader, StatusPill, newBtn, td, th } from "../_components/ui";

export default async function DriversAdmin() {
  await guard();
  const [rows, ts, counts] = await Promise.all([
    db.select().from(drivers).orderBy(asc(drivers.sortOrder), asc(drivers.name)),
    db.select().from(teams),
    db.select({ id: products.driverId, n: count() }).from(products).where(eq(products.status, "active")).groupBy(products.driverId),
  ]);
  const base = `${ADMIN}/drivers`;
  return (
    <>
      <DbNotice />
      <PageHeader actions={<Link href={`${base}/new`} className={newBtn}>New driver</Link>}>Drivers</PageHeader>
      {rows.length ? (
        <div className="overflow-x-auto rounded-[14px] border border-rule bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-rule"><tr><th className={th}>#</th><th className={th}>Driver</th><th className={th}>Team</th><th className={th}>Active products</th><th className={th}>Home page</th><th className={th}>Status</th></tr></thead>
            <tbody>
              {rows.map((d) => {
                const t = ts.find((x) => x.id === d.teamId);
                return (
                  <tr key={d.id} className="border-b border-rule last:border-0 hover:bg-paper/60">
                    <td className={`${td} font-mono text-xs text-ink-5`}>{d.number}</td>
                    <td className={td}><Link href={`${base}/${d.id}`} className="font-semibold hover:text-red">{d.name}</Link></td>
                    <td className={`${td} text-ink-4`}>{t && <span className="mr-1.5 inline-block h-2 w-2 rounded-full" style={{ background: t.color ?? "#111" }} />}{t?.name ?? "—"}</td>
                    <td className={`${td} tabular-nums`}>{counts.find((c) => c.id === d.id)?.n ?? 0}</td>
                    <td className={td}>{d.featured ? <span className="text-xs font-semibold text-red">Featured</span> : <span className="text-xs text-ink-5">—</span>}</td>
                    <td className={td}><StatusPill live={d.published} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty>No drivers yet.</Empty>
      )}
    </>
  );
}
