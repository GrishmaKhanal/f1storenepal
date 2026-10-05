import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { categories, drivers, media, productImages, products, productVariants, teams } from "@/db/schema";
import { ADMIN } from "@/lib/admin-path";
import { guard, isCreated, library, lite } from "../../_lib";
import { DbNotice } from "../../_nodb";
import { PageHeader } from "../../_components/ui";
import { ProductForm } from "./form";

export default async function ProductEdit({ params, searchParams }: PageProps<"/admin/products/[id]">) {
  await guard();
  const { id } = await params;
  const isNew = id === "new";
  const pid = Number(id);
  if (!isNew && !Number.isInteger(pid)) notFound();

  const [product, vs, imgs, ts, ds, cs, lib] = await Promise.all([
    isNew ? null : db.query.products.findFirst({ where: eq(products.id, pid) }),
    isNew ? [] : db.select().from(productVariants).where(eq(productVariants.productId, pid)).orderBy(asc(productVariants.sortOrder)),
    isNew ? [] : db.select({ m: media }).from(productImages).innerJoin(media, eq(media.id, productImages.mediaId)).where(eq(productImages.productId, pid)).orderBy(asc(productImages.sortOrder)),
    db.select({ id: teams.id, name: teams.name }).from(teams).orderBy(asc(teams.sortOrder)),
    db.select({ id: drivers.id, name: drivers.name, teamId: drivers.teamId }).from(drivers).orderBy(asc(drivers.sortOrder)),
    db.select({ id: categories.id, name: categories.name }).from(categories).orderBy(asc(categories.sortOrder)),
    library(),
  ]);
  if (!isNew && !product) notFound();

  return (
    <>
      <DbNotice />
      <PageHeader back={["Products", `${ADMIN}/products`]}>{product?.name ?? "New product"}</PageHeader>
      <ProductForm
        product={product ?? null}
        variants={vs.map((v) => ({ id: v.id, label: v.label, sku: v.sku, price: v.price, stock: v.stock }))}
        images={imgs.map((i) => lite(i.m))}
        library={lib}
        teams={ts.map((t) => [t.id, t.name])}
        drivers={ds.map((d) => [d.id, d.name])}
        categories={cs.map((c) => [c.id, c.name])}
        created={await isCreated(searchParams)}
      />
    </>
  );
}
