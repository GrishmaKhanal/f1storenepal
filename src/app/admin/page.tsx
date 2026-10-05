import Link from "next/link";
import { and, count, desc, eq, gte, isNotNull, lte, ne, sql, sum } from "drizzle-orm";
import { db, hasDb } from "@/db";
import { categories, drivers, orders, products, productVariants, settings, teams } from "@/db/schema";
import { defaultSettings } from "@/content/seed";
import { isAdmin } from "@/lib/auth";
import { ADMIN } from "@/lib/admin-path";
import { orderNo, rs } from "@/lib/money";
import { LoginForm } from "./_components/login";
import { card, OrderPill, title } from "./_components/ui";
import { DbNotice } from "./_nodb";
import { importStarterContent, refreshPublicPages } from "./actions";

// "Import starter content" downloads and resizes ~45 product photos; give it room
// beyond the default function timeout.
export const maxDuration = 300;

export default async function AdminHome({ searchParams }: PageProps<"/admin">) {
  if (!(await isAdmin())) return <LoginForm />;
  if (!hasDb) return <DbNotice />;

  const [srow] = await db.select().from(settings).where(eq(settings.key, "site"));
  const low = (srow?.value.lowStockThreshold ?? defaultSettings.lowStockThreshold);
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  const [byStatus, counts, outOfStock, lowStock, month, recent] = await Promise.all([
    db.select({ status: products.status, n: count() }).from(products).groupBy(products.status),
    Promise.all([db.select({ n: count() }).from(teams), db.select({ n: count() }).from(drivers), db.select({ n: count() }).from(categories), db.select({ n: count() }).from(orders).where(eq(orders.status, "new"))]),
    db
      .select({ id: products.id, name: products.name, label: productVariants.label, stock: productVariants.stock })
      .from(productVariants)
      .innerJoin(products, eq(products.id, productVariants.productId))
      .where(and(eq(products.status, "active"), eq(productVariants.stock, 0))),
    db
      .select({ id: products.id, name: products.name, label: productVariants.label, stock: productVariants.stock })
      .from(productVariants)
      .innerJoin(products, eq(products.id, productVariants.productId))
      .where(and(eq(products.status, "active"), isNotNull(productVariants.stock), gte(productVariants.stock, 1), lte(productVariants.stock, low)))
      .orderBy(productVariants.stock),
    db
      .select({ n: count(), total: sum(orders.total) })
      .from(orders)
      .where(and(gte(orders.createdAt, monthStart), ne(orders.status, "cancelled"))),
    db.select().from(orders).orderBy(desc(orders.createdAt)).limit(6),
  ]);
  const st = Object.fromEntries(byStatus.map((r) => [r.status, r.n])) as Record<string, number>;
  const [teamN, driverN, catN, newN] = counts.map((c) => c[0].n);
  const totalProducts = (st.active ?? 0) + (st.draft ?? 0) + (st.archived ?? 0);
  const units = await db.select({ n: sql<number>`coalesce(sum(${productVariants.stock}), 0)::int` }).from(productVariants).innerJoin(products, eq(products.id, productVariants.productId)).where(eq(products.status, "active"));

  const cards: [string, React.ReactNode, string | null, string][] = [
    ["New orders", newN, newN ? "waiting for you to confirm" : "all caught up", "/orders?status=new"],
    ["Orders this month", month[0].n, month[0].total ? rs(Number(month[0].total)) : null, "/orders"],
    ["Active products", st.active ?? 0, `${st.draft ?? 0} draft · ${units[0].n} units tracked`, "/products"],
    ["Out of stock", outOfStock.length, lowStock.length ? `${lowStock.length} running low (≤ ${low})` : null, "/products?stock=out"],
    ["Teams", teamN, null, "/teams"],
    ["Drivers", driverN, null, "/drivers"],
    ["Categories", catN, null, "/categories"],
  ];

  return (
    <>
      {totalProducts + teamN === 0 && (
        <form action={importStarterContent} className={`${card} mb-6 flex flex-wrap items-center justify-between gap-3 p-4 text-sm`}>
          <span>The store is empty. Import the starter teams, drivers, categories, products and settings from the design?</span>
          <button className="cursor-pointer rounded-full bg-ink px-4 py-2 text-white hover:bg-red">Import starter content</button>
        </form>
      )}
      <h1 className={`mb-6 ${title}`}>Dashboard</h1>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {cards.map(([label, n, note, href]) => (
          <Link key={label} href={`${ADMIN}${href}`} className={`${card} p-4 transition-colors hover:border-ink hover:text-ink sm:p-5`}>
            <p className="text-sm text-ink-5">{label}</p>
            <p className="mt-1 text-3xl font-semibold tabular-nums">{n}</p>
            {note && <p className="mt-1 text-xs text-ink-5">{note}</p>}
          </Link>
        ))}
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-2">
        <section>
          <h2 className="mb-2 border-b border-ink pb-2 font-display text-xl font-bold uppercase">Latest orders</h2>
          {recent.map((o) => (
            <Link key={o.id} href={`${ADMIN}/orders/${o.id}`} className="flex items-center justify-between gap-4 border-b border-rule py-3 hover:text-ink">
              <span className="flex flex-col">
                <span className="text-sm font-semibold">{orderNo(o.id)} · {o.customerName}</span>
                <span className="font-mono text-xs text-ink-5">{o.createdAt.toISOString().slice(0, 16).replace("T", " ")}</span>
              </span>
              <span className="flex items-center gap-3 text-sm tabular-nums">
                {rs(o.total)}
                <OrderPill status={o.status} />
              </span>
            </Link>
          ))}
          {!recent.length && <p className="py-3 text-sm text-ink-5">No orders yet.</p>}
        </section>
        <section>
          <h2 className="mb-2 border-b border-ink pb-2 font-display text-xl font-bold uppercase">Stock alerts</h2>
          {[...outOfStock, ...lowStock].slice(0, 12).map((v, i) => (
            <Link key={i} href={`${ADMIN}/products/${v.id}`} className="flex items-center justify-between gap-4 border-b border-rule py-2.5 text-sm hover:text-ink">
              <span>
                {v.name}
                {v.label && <span className="text-ink-5"> · {v.label}</span>}
              </span>
              <span className={`font-mono text-xs ${v.stock === 0 ? "text-red" : "text-amber-700"}`}>{v.stock === 0 ? "sold out" : `${v.stock} left`}</span>
            </Link>
          ))}
          {!outOfStock.length && !lowStock.length && <p className="py-3 text-sm text-ink-5">Nothing out of stock or running low.</p>}
        </section>
      </div>

      <p className="mt-10 text-sm text-ink-5">
        Saving publishes instantly: product pages, collections and <a className="underline" href="/sitemap.xml" target="_blank">sitemap.xml</a> regenerate on the next visit.
      </p>
      <form action={refreshPublicPages} className="mt-3 flex flex-wrap items-center gap-3 text-sm text-ink-5">
        <span>Changed the database outside the admin?</span>
        <button className="cursor-pointer rounded-full border border-rule-strong bg-white px-3 py-1 text-ink hover:border-ink">Refresh public pages</button>
        {(await searchParams).refreshed && <span className="text-green-800">Done. Public pages rebuild on their next visit.</span>}
      </form>
    </>
  );
}
