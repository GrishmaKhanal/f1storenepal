import Link from "next/link";
import { asc, count, eq } from "drizzle-orm";
import { db } from "@/db";
import { categories, products } from "@/db/schema";
import { ADMIN } from "@/lib/admin-path";
import { guard } from "../_lib";
import { DbNotice } from "../_nodb";
import { Empty, PageHeader, StatusPill, newBtn, td, th } from "../_components/ui";

export default async function CategoriesAdmin() {
  await guard();
  const [rows, counts] = await Promise.all([
    db.select().from(categories).orderBy(asc(categories.sortOrder), asc(categories.name)),
    db.select({ id: products.categoryId, n: count() }).from(products).where(eq(products.status, "active")).groupBy(products.categoryId),
  ]);
  const base = `${ADMIN}/categories`;
  return (
    <>
      <DbNotice />
      <PageHeader actions={<Link href={`${base}/new`} className={newBtn}>New category</Link>}>Categories</PageHeader>
      {rows.length ? (
        <div className="overflow-x-auto rounded-[14px] border border-rule bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-rule"><tr><th className={th}>Category</th><th className={th}>Active products</th><th className={th}>Accessories</th><th className={th}>New-in tab</th><th className={th}>Status</th></tr></thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} className="border-b border-rule last:border-0 hover:bg-paper/60">
                  <td className={td}><Link href={`${base}/${c.id}`} className="font-semibold hover:text-red">{c.name}</Link></td>
                  <td className={`${td} tabular-nums`}>{counts.find((x) => x.id === c.id)?.n ?? 0}</td>
                  <td className={td}>{c.isAccessory ? "✓" : <span className="text-ink-5">—</span>}</td>
                  <td className={td}>{c.showAsTab ? "✓" : <span className="text-ink-5">—</span>}</td>
                  <td className={td}><StatusPill live={c.published} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty>No categories yet.</Empty>
      )}
    </>
  );
}
