import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InstagramCta } from "@/components/chrome";
import { Collection } from "@/components/Collection";
import { getCatalog, getProducts, getSettings } from "@/lib/data";
import { paths } from "@/lib/site";

export async function generateStaticParams() {
  return (await getCatalog()).teams.map((t) => ({ slug: t.slug }));
}

async function load(slug: string) {
  return (await getCatalog()).teams.find((t) => t.slug === slug) ?? null;
}

export async function generateMetadata({ params }: PageProps<"/teams/[slug]">): Promise<Metadata> {
  const t = await load((await params).slug);
  if (!t) return {};
  return {
    title: t.seoTitle || `${t.name} F1 merchandise and diecast cars`,
    description: t.seoDescription || t.description || `Shop ${t.name} Formula 1 diecast model cars, caps and gifts in Nepal. Cash on delivery, eSewa and Khalti.`,
    alternates: { canonical: paths.team(t.slug) },
  };
}

export default async function TeamPage({ params }: PageProps<"/teams/[slug]">) {
  const { slug } = await params;
  const [t, products, s] = await Promise.all([load(slug), getProducts(), getSettings()]);
  if (!t) notFound();
  return (
    <Collection
      crumbs={[["Teams", "/teams"], [t.name, paths.team(t.slug)]]}
      title={t.name}
      intro={t.description}
      accent={t.color}
      url={paths.team(t.slug)}
      products={products.filter((p) => p.team?.slug === t.slug)}
      aside={<InstagramCta url={s.instagramUrl} handle={s.instagramHandle} text={`Looking for something ${t.name} we don't list?`} />}
    />
  );
}
