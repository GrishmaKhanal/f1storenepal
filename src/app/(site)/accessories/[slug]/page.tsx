import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Collection } from "@/components/Collection";
import { getCatalog, getProducts, getSettings } from "@/lib/data";
import { collectionDescription, collectionIntro } from "@/lib/seo";
import { paths } from "@/lib/site";

// Every category has a page here (diecast too); the Accessories menu lists only the
// ones flagged as accessories.
export async function generateStaticParams() {
  return (await getCatalog()).categories.map((c) => ({ slug: c.slug }));
}

async function load(slug: string) {
  const [{ categories }, all] = await Promise.all([getCatalog(), getProducts()]);
  const c = categories.find((x) => x.slug === slug);
  if (!c) return null;
  const products = all.filter((p) => p.category?.slug === c.slug);
  return { c, products, generated: collectionIntro(products, { featuring: ["driver", "team"] }) };
}

export async function generateMetadata({ params }: PageProps<"/accessories/[slug]">): Promise<Metadata> {
  const [x, s] = await Promise.all([load((await params).slug), getSettings()]);
  if (!x) return {};
  const { c, generated } = x;
  return {
    title: c.seoTitle || `F1 ${c.name.toLowerCase()}`,
    description: c.seoDescription || c.description || collectionDescription(generated, `F1 ${c.name.toLowerCase()}`, s.paymentMethods.map((m) => m.label)),
    alternates: { canonical: paths.category(c.slug) },
  };
}

export default async function CategoryPage({ params }: PageProps<"/accessories/[slug]">) {
  const x = await load((await params).slug);
  if (!x) notFound();
  const { c, products, generated } = x;
  return (
    <Collection
      crumbs={c.isAccessory ? [["Accessories", "/accessories"], [c.name, paths.category(c.slug)]] : [["Shop", "/shop"], [c.name, paths.category(c.slug)]]}
      title={c.name}
      intro={c.description || generated}
      url={paths.category(c.slug)}
      products={products}
    />
  );
}
