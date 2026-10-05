import type { ProductView } from "@/lib/data";
import { abs, paths } from "@/lib/site";
import { JsonLd } from "./JsonLd";
import { ProductGrid } from "./ProductCard";
import { PageHead, wrap } from "./chrome";

/** Shared layout for team, driver, category and "new" listing pages. */
export function Collection({
  crumbs,
  title,
  intro,
  accent,
  products,
  url,
  aside,
}: {
  crumbs: [string, string][];
  title: string;
  intro?: string | null;
  accent?: string | null;
  products: ProductView[];
  url: string;
  aside?: React.ReactNode;
}) {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: title,
          url: abs(url),
          description: intro ?? undefined,
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: products.length,
            itemListElement: products.slice(0, 50).map((p, i) => ({ "@type": "ListItem", position: i + 1, url: abs(paths.product(p.slug)), name: p.name })),
          },
        }}
      />
      <PageHead crumbs={crumbs} title={title} intro={intro} accent={accent}>
        <span className="font-mono text-xs text-faint">
          {products.length} product{products.length === 1 ? "" : "s"}
        </span>
      </PageHead>
      <section className={`${wrap} pb-[72px]`}>
        <ProductGrid products={products} />
        {aside && <div className="mt-12">{aside}</div>}
      </section>
    </>
  );
}
