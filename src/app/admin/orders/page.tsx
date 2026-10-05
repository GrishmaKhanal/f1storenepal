import Link from "next/link";
import { count, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { orders, orderStatus } from "@/db/schema";
import { ADMIN } from "@/lib/admin-path";
import { orderNo, rs } from "@/lib/money";
import { guard } from "../_lib";
import { DbNotice } from "../_nodb";
import { Empty, Filters, OrderPill, PageHeader, td, th } from "../_components/ui";

export default async function OrdersAdmin({ searchParams }: PageProps<"/admin/orders">) {
  await guard();
  const status = String((await searchParams).status ?? "all");
  const valid = (orderStatus.enumValues as readonly string[]).includes(status);
  const [rows, counts] = await Promise.all([
    db.select().from(orders).where(valid ? eq(orders.status, status as never) : undefined).orderBy(desc(orders.createdAt)).limit(300),
    db.select({ status: orders.status, n: count() }).from(orders).groupBy(orders.status),
  ]);
  const n = (s: string) => counts.find((c) => c.status === s)?.n ?? 0;
  const base = `${ADMIN}/orders`;
  return (
    <>
      <DbNotice />
      <PageHeader>Orders</PageHeader>
      <Filters
        current={valid ? status : "all"}
        items={[["all", "All", counts.reduce((s, c) => s + c.n, 0), base], ...orderStatus.enumValues.map((s) => [s, s[0].toUpperCase() + s.slice(1), n(s), `${base}?status=${s}`] as [string, string, number, string])]}
      />
      {rows.length ? (
        <div className="overflow-x-auto rounded-[14px] border border-rule bg-white">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="border-b border-rule"><tr><th className={th}>Order</th><th className={th}>Customer</th><th className={th}>Area</th><th className={th}>Payment</th><th className={th}>Total</th><th className={th}>Status</th></tr></thead>
            <tbody>
              {rows.map((o) => (
                <tr key={o.id} className="border-b border-rule last:border-0 hover:bg-paper/60">
                  <td className={td}>
                    <Link href={`${base}/${o.id}`} className="font-semibold hover:text-red">{orderNo(o.id)}</Link>
                    <div className="font-mono text-[11px] text-ink-5">{o.createdAt.toISOString().slice(0, 16).replace("T", " ")} UTC</div>
                  </td>
                  <td className={td}>{o.customerName}<div className="text-xs text-ink-5">{o.phone}</div></td>
                  <td className={`${td} text-ink-4`}>{o.deliveryZone ?? o.city}</td>
                  <td className={`${td} text-ink-4`}>{o.paymentMethod}</td>
                  <td className={`${td} tabular-nums`}>{rs(o.total)}</td>
                  <td className={td}><OrderPill status={o.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty>No orders{valid ? ` with status “${status}”` : " yet"}.</Empty>
      )}
    </>
  );
}
