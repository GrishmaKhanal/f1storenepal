import Link from "next/link";
import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { categories, media, productImages, products, productVariants, teams } from "@/db/schema";
import { ADMIN } from "@/lib/admin-path";
import { mediaUrl } from "@/lib/media-url";
import { rs } from "@/lib/money";
import { guard } from "../_lib";
import { DbNotice } from "../_nodb";
import { setStock } from "../actions";
import { Empty, Filters, PageHeader, StatusPill, Thumb, newBtn, td, th } from "../_components/ui";

export default async function ProductsAdmin({ searchParams }: PageProps<"/admin/products">) {
  await guard();
  const sp = await searchParams;
  const status = String(sp.status ?? "all");
  const stock = String(sp.stock ?? "");
  const q = String(sp.q ?? "").trim().toLowerCase();

  const [rows, vs, imgs, ts, cs] = await Promise.all([
    db.select().from(products).orderBy(asc(products.sortOrder), desc(products.updatedAt)),
    db.select().from(productVariants).orderBy(asc(productVariants.sortOrder)),
    db.select({ productId: productImages.productId, m: media }).from(productImages).innerJoin(media, eq(media.id, productImages.mediaId)).where(eq(productImages.sortOrder, 0)),
    db.select({ id: teams.id, name: teams.name, color: teams.color }).from(teams),
    db.select({ id: categories.id, name: categories.name }).from(categories),
  ]);

  const withVs = rows.map((p) => ({ p, vs: vs.filter((v) => v.productId === p.id) }));
  const shown = withVs.filter(({ p, vs }) => {
    if (status !== "all" && p.status !== status) return false;
    if (stock === "out" && !vs.some((v) => v.stock === 0)) return false;
    if (q && !`${p.name} ${p.slug} ${vs.map((v) => v.sku ?? "").join(" ")}`.toLowerCase().includes(q)) return false;
    return true;
  });
  const n = (s: string) => rows.filter((p) => p.status === s).length;
  const base = `${ADMIN}/products`;

  return (
    <>
      <DbNotice />
      <PageHeader actions={<Link href={`${base}/new`} className={newBtn}>New product</Link>}>Products</PageHeader>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <Filters
          current={stock === "out" ? "out" : status}
          items={[
            ["all", "All", rows.length, base],
            ["active", "Active", n("active"), `${base}?status=active`],
            ["draft", "Draft", n("draft"), `${base}?status=draft`],
            ["archived", "Archived", n("archived"), `${base}?status=archived`],
            ["out", "Out of stock", withVs.filter(({ vs }) => vs.some((v) => v.stock === 0)).length, `${base}?stock=out`],
          ]}
        />
        <form className="mb-4">
          <input name="q" defaultValue={q} placeholder="Search name or SKU" className="rounded-full border border-rule bg-white px-4 py-1.5 text-sm outline-none focus:border-ink" />
        </form>
      </div>
      {shown.length ? (
        <div className="overflow-x-auto rounded-[14px] border border-rule bg-white">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="border-b border-rule">
              <tr>
                <th className={th}>Product</th>
                <th className={th}>Team / category</th>
                <th className={th}>Price</th>
                <th className={th}>Stock</th>
                <th className={th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {shown.map(({ p, vs }) => {
                const img = imgs.find((i) => i.productId === p.id)?.m;
                const team = ts.find((t) => t.id === p.teamId);
                const cat = cs.find((c) => c.id === p.categoryId);
                return (
                  <tr key={p.id} className="border-b border-rule last:border-0 hover:bg-paper/60">
                    <td className={td}>
                      <Link href={`${base}/${p.id}`} className="flex items-center gap-3 font-semibold hover:text-red">
                        <Thumb src={img ? mediaUrl(img, 480) : null} />
                        <span>
                          {p.name}
                          {p.badge && <span className="ml-2 rounded-full bg-ink px-1.5 py-0.5 text-[10px] font-semibold text-white">{p.badge}</span>}
                        </span>
                      </Link>
                    </td>
                    <td className={`${td} text-ink-4`}>
                      {team && <span className="mr-1.5 inline-block h-2 w-2 rounded-full" style={{ background: team.color ?? "#111" }} />}
                      {[team?.name, cat?.name].filter(Boolean).join(" · ") || "—"}
                    </td>
                    <td className={`${td} tabular-nums`}>{p.price != null ? rs(p.price) : <span className="text-ink-5">no price</span>}</td>
                    <td className={td}>
                      <div className="flex flex-col gap-1">
                        {vs.map((v) => (
                          <form key={v.id} action={setStock} className="flex items-center gap-2">
                            <input type="hidden" name="variantId" value={v.id} />
                            {v.label && <span className="w-14 truncate text-xs text-ink-5">{v.label}</span>}
                            <input
                              name="stock"
                              defaultValue={v.stock ?? ""}
                              placeholder="∞"
                              inputMode="numeric"
                              aria-label={`Stock${v.label ? ` for ${v.label}` : ""}`}
                              className={`w-16 rounded-md border px-2 py-1 text-sm tabular-nums outline-none focus:border-ink ${v.stock === 0 ? "border-red text-red" : "border-rule"}`}
                            />
                            <button className="cursor-pointer text-xs text-ink-5 underline hover:text-ink">set</button>
                          </form>
                        ))}
                      </div>
                    </td>
                    <td className={td}>
                      <StatusPill live={p.status === "active"} on="Active" off={p.status === "draft" ? "Draft" : "Archived"} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty>No products here. <Link href={`${base}/new`} className="underline">Add one</Link>.</Empty>
      )}
    </>
  );
}
