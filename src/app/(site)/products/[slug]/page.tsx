import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Crumbs, InstagramCta, Paras, SectionHead, wrap } from "@/components/chrome";
import { JsonLd } from "@/components/JsonLd";
import { BuyBox, Gallery } from "@/components/ProductBuy";
import { ProductGrid } from "@/components/ProductCard";
import { getProduct, getProducts, getSettings } from "@/lib/data";
import { abs, paths, SITE_URL } from "@/lib/site";

export async function generateStaticParams() {
  return (await getProducts()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/products/[slug]">): Promise<Metadata> {
  const p = await getProduct((await params).slug);
  if (!p) return {};
  const price = p.variants.find((v) => v.price != null)?.price ?? p.price;
  const desc =
    p.seoDescription ||
    [p.description, price != null ? `Rs ${price.toLocaleString("en-IN")}.` : null, "Delivered across Nepal."].filter(Boolean).join(" ").slice(0, 300);
  const img = p.images[0];
  return {
    title: p.seoTitle || p.name,
    description: desc,
    alternates: { canonical: paths.product(p.slug) },
    openGraph: {
      title: p.name,
      description: desc,
      url: paths.product(p.slug),
      images: img ? [{ url: abs(img.large), alt: img.alt }] : undefined,
    },
  };
}

export default async function ProductPage({ params }: PageProps<"/products/[slug]">) {
  const { slug } = await params;
  const [p, all, s] = await Promise.all([getProduct(slug), getProducts(), getSettings()]);
  if (!p) notFound();

  const related = all
    .filter((x) => x.id !== p.id)
    .map((x) => ({ x, score: (x.driver && x.driver.slug === p.driver?.slug ? 3 : 0) + (x.team && x.team.slug === p.team?.slug ? 2 : 0) + (x.category?.slug === p.category?.slug ? 1 : 0) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((r) => r.x);

  const crumbs: [string, string][] = p.team
    ? [["Teams", "/teams"], [p.team.name, paths.team(p.team.slug)], [p.name, paths.product(p.slug)]]
    : p.category
      ? [[p.category.isAccessory ? "Accessories" : "Shop", p.category.isAccessory ? "/accessories" : "/shop"], [p.category.name, paths.category(p.category.slug)], [p.name, paths.product(p.slug)]]
      : [["Shop", "/shop"], [p.name, paths.product(p.slug)]];

  const priced = p.variants.filter((v) => v.price != null);
  const offer = (v: (typeof p.variants)[number]) => ({
    "@type": "Offer",
    url: abs(paths.product(p.slug)),
    priceCurrency: "NPR",
    price: v.price,
    availability: v.available ? (p.badge?.toLowerCase() === "pre-order" ? "https://schema.org/PreOrder" : "https://schema.org/InStock") : "https://schema.org/OutOfStock",
    itemCondition: "https://schema.org/NewCondition",
    seller: { "@id": `${SITE_URL}/#store` },
  });

  const details = [
    ["Team", p.team && <Link href={paths.team(p.team.slug)} className="underline">{p.team.name}</Link>],
    ["Driver", p.driver && <Link href={paths.driver(p.driver.slug)} className="underline">{p.driver.name}</Link>],
    ["Category", p.category && <Link href={paths.category(p.category.slug)} className="underline">{p.category.name}</Link>],
    ["Brand", p.brand],
    ["Scale", p.scale],
  ].filter(([, v]) => v) as [string, React.ReactNode][];

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: p.name,
          description: p.description ?? undefined,
          url: abs(paths.product(p.slug)),
          image: p.images.map((i) => abs(i.large)),
          brand: p.brand ? { "@type": "Brand", name: p.brand } : undefined,
          category: p.category?.name,
          offers: priced.length > 1 && new Set(priced.map((v) => v.price)).size > 1
            ? { "@type": "AggregateOffer", priceCurrency: "NPR", lowPrice: Math.min(...priced.map((v) => v.price!)), highPrice: Math.max(...priced.map((v) => v.price!)), offerCount: priced.length, offers: priced.map(offer) }
            : priced[0] ? offer(priced[0]) : undefined,
        }}
      />
      <div className={`${wrap} pt-8 pb-16 sm:pt-10`}>
        <Crumbs items={crumbs} />
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-14">
          <Gallery images={p.images} name={p.name} />
          <div className="flex flex-col gap-6 lg:sticky lg:top-24 lg:self-start">
            <div>
              {(p.team || p.badge) && (
                <div className="mb-3 flex flex-wrap items-center gap-3 text-[13px]">
                  {p.team && (
                    <span className="flex items-center gap-2 text-faint">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: p.team.color ?? "#111" }} />
                      {p.team.name}
                      {p.scale && ` · ${p.scale}`}
                    </span>
                  )}
                  {p.badge && <span className="rounded-full bg-ink px-2.5 py-1 text-[11px] font-semibold tracking-[.04em] text-white">{p.badge}</span>}
                </div>
              )}
              <h1 className="display text-[clamp(38px,5vw,60px)] leading-[.95] font-extrabold">{p.name}</h1>
            </div>
            <BuyBox product={{ slug: p.slug, name: p.name, image: p.images[0]?.src ?? null }} variants={p.variants} lowStock={s.lowStockThreshold} />
            <InstagramCta url={s.instagramUrl} handle={s.instagramHandle} text="Prefer to order on Instagram?" />
            {p.description && <Paras text={p.description} className="text-[15.5px] leading-relaxed text-[#33302c]" />}
            {details.length > 0 && (
              <dl className="grid grid-cols-[110px_1fr] gap-y-2 border-t border-rule pt-5 text-sm">
                {details.map(([k, v]) => (
                  <div key={k} className="contents">
                    <dt className="text-faint">{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>
            )}
            {s.steps.length > 0 && (
              <ul className="flex flex-col gap-1.5 rounded-[14px] bg-white p-4 text-[13px] text-muted">
                {s.steps.map((st, i) => (
                  <li key={i}>
                    <span className="font-semibold text-ink">{st.title}.</span> {st.body}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
      {related.length > 0 && (
        <section className={`${wrap} pb-[72px]`}>
          <SectionHead title="YOU MIGHT ALSO LIKE" />
          <ProductGrid products={related} />
        </section>
      )}
    </>
  );
}
