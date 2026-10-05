import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { ADMIN } from "@/lib/admin-path";
import { guard, isCreated } from "../../_lib";
import { PageHeader } from "../../_components/ui";
import { CategoryForm } from "../../_components/catalog-forms";

export default async function CategoryEdit({ params, searchParams }: PageProps<"/admin/categories/[id]">) {
  await guard();
  const { id } = await params;
  const category = id === "new" ? null : await db.query.categories.findFirst({ where: eq(categories.id, Number(id) || 0) });
  if (id !== "new" && !category) notFound();
  return (
    <>
      <PageHeader back={["Categories", `${ADMIN}/categories`]}>{category?.name ?? "New category"}</PageHeader>
      <CategoryForm category={category ?? null} created={await isCreated(searchParams)} />
    </>
  );
}
