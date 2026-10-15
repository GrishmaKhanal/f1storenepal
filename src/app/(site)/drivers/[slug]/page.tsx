import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InstagramCta } from "@/components/chrome";
import { Collection } from "@/components/Collection";
import { getCatalog, getProducts, getSettings } from "@/lib/data";
import { collectionDescription, collectionIntro, whatsSold, withF1 } from "@/lib/seo";
import { paths } from "@/lib/site";

export async function generateStaticParams() {
  return (await getCatalog()).drivers.map((d) => ({ slug: d.slug }));
}

async function load(slug: string) {
  const [{ drivers }, all] = await Promise.all([getCatalog(), getProducts()]);
  const d = drivers.find((x) => x.slug === slug);
  if (!d) return null;
  const products = all.filter((p) => p.driver?.slug === d.slug);
  return { d, products, generated: collectionIntro(products, { subject: d.name }) };
}

export async function generateMetadata({ params }: PageProps<"/drivers/[slug]">): Promise<Metadata> {
  const [x, s] = await Promise.all([load((await params).slug), getSettings()]);
  if (!x) return {};
  const { d, products, generated } = x;
  return {
    title: d.seoTitle || `${d.name} ${withF1(whatsSold(products) ?? "merchandise")}`,
    description: d.seoDescription || d.description || collectionDescription(generated, `${d.name} F1 merchandise`, s.paymentMethods.map((m) => m.label)),
    alternates: { canonical: paths.driver(d.slug) },
  };
}

export default async function DriverPage({ params }: PageProps<"/drivers/[slug]">) {
  const { slug } = await params;
  const [x, s] = await Promise.all([load(slug), getSettings()]);
  if (!x) notFound();
  const { d, products, generated } = x;
  return (
    <Collection
      crumbs={[["Drivers", "/drivers"], [d.name, paths.driver(d.slug)]]}
      title={d.name}
      intro={d.description || generated}
      meta={[d.number != null && `#${d.number}`, d.team?.name].filter(Boolean).join(" · ")}
      accent={d.team?.color}
      url={paths.driver(d.slug)}
      products={products}
      aside={<InstagramCta url={s.instagramUrl} handle={s.instagramHandle} text={`Want a ${d.name} piece we don't list?`} />}
    />
  );
}
