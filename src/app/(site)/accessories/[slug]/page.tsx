import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Collection } from "@/components/Collection";
import { getCatalog, getProducts } from "@/lib/data";
import { paths } from "@/lib/site";

// Every category has a page here (diecast too); the Accessories menu lists only the
// ones flagged as accessories.
export async function generateStaticParams() {
  return (await getCatalog()).categories.map((c) => ({ slug: c.slug }));
}

async function load(slug: string) {
  return (await getCatalog()).categories.find((c) => c.slug === slug) ?? null;
}

export async function generateMetadata({ params }: PageProps<"/accessories/[slug]">): Promise<Metadata> {
  const c = await load((await params).slug);
  if (!c) return {};
  return {
    title: c.seoTitle || `F1 ${c.name.toLowerCase()}`,
    description: c.seoDescription || c.description || `Shop Formula 1 ${c.name.toLowerCase()} in Nepal. Cash on delivery, eSewa and Khalti, delivered nationwide.`,
    alternates: { canonical: paths.category(c.slug) },
  };
}

export default async function CategoryPage({ params }: PageProps<"/accessories/[slug]">) {
  const { slug } = await params;
  const [c, products] = await Promise.all([load(slug), getProducts()]);
  if (!c) notFound();
  return (
    <Collection
      crumbs={c.isAccessory ? [["Accessories", "/accessories"], [c.name, paths.category(c.slug)]] : [["Shop", "/shop"], [c.name, paths.category(c.slug)]]}
      title={c.name}
      intro={c.description}
      url={paths.category(c.slug)}
      products={products.filter((p) => p.category?.slug === c.slug)}
    />
  );
}
