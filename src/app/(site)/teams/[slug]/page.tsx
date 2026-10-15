import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InstagramCta } from "@/components/chrome";
import { Collection } from "@/components/Collection";
import { getCatalog, getProducts, getSettings } from "@/lib/data";
import { collectionDescription, collectionIntro, whatsSold, withF1 } from "@/lib/seo";
import { paths } from "@/lib/site";

export async function generateStaticParams() {
  return (await getCatalog()).teams.map((t) => ({ slug: t.slug }));
}

async function load(slug: string) {
  const [{ teams }, all] = await Promise.all([getCatalog(), getProducts()]);
  const t = teams.find((x) => x.slug === slug);
  if (!t) return null;
  const products = all.filter((p) => p.team?.slug === t.slug);
  return { t, products, generated: collectionIntro(products, { subject: t.name, featuring: ["driver"] }) };
}

export async function generateMetadata({ params }: PageProps<"/teams/[slug]">): Promise<Metadata> {
  const [x, s] = await Promise.all([load((await params).slug), getSettings()]);
  if (!x) return {};
  const { t, products, generated } = x;
  return {
    title: t.seoTitle || `${t.name} ${withF1(whatsSold(products) ?? "merchandise")}`,
    description: t.seoDescription || t.description || collectionDescription(generated, `${t.name} F1 merchandise`, s.paymentMethods.map((m) => m.label)),
    alternates: { canonical: paths.team(t.slug) },
  };
}

export default async function TeamPage({ params }: PageProps<"/teams/[slug]">) {
  const { slug } = await params;
  const [x, s] = await Promise.all([load(slug), getSettings()]);
  if (!x) notFound();
  const { t, products, generated } = x;
  return (
    <Collection
      crumbs={[["Teams", "/teams"], [t.name, paths.team(t.slug)]]}
      title={t.name}
      intro={t.description || generated}
      accent={t.color}
      url={paths.team(t.slug)}
      products={products}
      aside={<InstagramCta url={s.instagramUrl} handle={s.instagramHandle} text={`Looking for something ${t.name} we don't list?`} />}
    />
  );
}
