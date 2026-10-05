import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InstagramCta } from "@/components/chrome";
import { Collection } from "@/components/Collection";
import { getCatalog, getProducts, getSettings } from "@/lib/data";
import { paths } from "@/lib/site";

export async function generateStaticParams() {
  return (await getCatalog()).drivers.map((d) => ({ slug: d.slug }));
}

async function load(slug: string) {
  return (await getCatalog()).drivers.find((d) => d.slug === slug) ?? null;
}

export async function generateMetadata({ params }: PageProps<"/drivers/[slug]">): Promise<Metadata> {
  const d = await load((await params).slug);
  if (!d) return {};
  return {
    title: d.seoTitle || `${d.name} F1 diecast cars and merchandise`,
    description: d.seoDescription || d.description || `Shop ${d.name}${d.team ? ` (${d.team.name})` : ""} diecast model cars, caps and gifts in Nepal. Delivered nationwide.`,
    alternates: { canonical: paths.driver(d.slug) },
  };
}

export default async function DriverPage({ params }: PageProps<"/drivers/[slug]">) {
  const { slug } = await params;
  const [d, products, s] = await Promise.all([load(slug), getProducts(), getSettings()]);
  if (!d) notFound();
  return (
    <Collection
      crumbs={[["Drivers", "/drivers"], [d.name, paths.driver(d.slug)]]}
      title={d.name}
      intro={d.description ?? (d.team ? `#${d.number ?? ""} · ${d.team.name}` : null)}
      accent={d.team?.color}
      url={paths.driver(d.slug)}
      products={products.filter((p) => p.driver?.slug === d.slug)}
      aside={<InstagramCta url={s.instagramUrl} handle={s.instagramHandle} text={`Want a ${d.name} piece we don't list?`} />}
    />
  );
}
