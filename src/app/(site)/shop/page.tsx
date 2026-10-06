import type { Metadata } from "next";
import Link from "next/link";
import { PageHead, wrap } from "@/components/chrome";
import { ProductGrid, minPrice } from "@/components/ProductCard";
import { getCatalog, getProducts, type ProductView } from "@/lib/data";

export const metadata: Metadata = {
  title: "Shop all F1 diecast, caps and gifts",
  description: "Every F1 diecast model car, cap, keychain and Formula 1 gift in one place. Filter by team or category. Delivered to Kathmandu, Pokhara and all of Nepal.",
  // Filtered views (?team=, ?sort=) all point at the one canonical listing.
  alternates: { canonical: "/shop" },
};

const SORTS = [
  ["featured", "Featured"],
  ["new", "Newest"],
  ["price-asc", "Price: low to high"],
  ["price-desc", "Price: high to low"],
] as const;

export default async function Shop({ searchParams }: PageProps<"/shop">) {
  const sp = await searchParams;
  const one = (k: string) => (Array.isArray(sp[k]) ? sp[k][0] : sp[k]) ?? "";
  const team = one("team");
  const cat = one("cat");
  const sort = one("sort") || "featured";
  const inStock = one("stock") === "1";

  const [all, c] = await Promise.all([getProducts(), getCatalog()]);
  let ps: ProductView[] = all.filter((p) => (!team || p.team?.slug === team) && (!cat || p.category?.slug === cat) && (!inStock || p.inStock));
  const price = (p: ProductView) => minPrice(p) ?? Infinity;
  if (sort === "new") ps = [...ps].sort((a, b) => (b.publishedAt?.getTime() ?? 0) - (a.publishedAt?.getTime() ?? 0));
  if (sort === "price-asc") ps = [...ps].sort((a, b) => price(a) - price(b));
  if (sort === "price-desc") ps = [...ps].sort((a, b) => (price(b) === Infinity ? -1 : price(b)) - (price(a) === Infinity ? -1 : price(a)));

  const href = (patch: Record<string, string>) => {
    const q = new URLSearchParams({ ...(team && { team }), ...(cat && { cat }), ...(sort !== "featured" && { sort }), ...(inStock && { stock: "1" }), ...patch });
    for (const [k, v] of [...q]) if (!v) q.delete(k);
    const s = q.toString();
    return s ? `/shop?${s}` : "/shop";
  };
  const chip = (on: boolean) => `rounded-full border px-3.5 py-2 text-[13px] font-semibold whitespace-nowrap transition-colors ${on ? "border-ink bg-ink text-white hover:text-white" : "border-[#d9d6d0] bg-white hover:border-ink hover:text-ink"}`;

  return (
    <>
      <PageHead crumbs={[["Shop", "/shop"]]} title="Shop all" intro="Diecast cars, caps and gifts from every team.">
        <span className="font-mono text-xs text-faint">
          {ps.length} product{ps.length === 1 ? "" : "s"}
        </span>
      </PageHead>
      <section className={`${wrap} pb-[72px]`}>
        <div className="mb-8 flex flex-col gap-3">
          <div className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
            <Link href={href({ cat: "" })} className={chip(!cat)}>All categories</Link>
            {c.categories.filter((x) => x.count).map((x) => (
              <Link key={x.slug} href={href({ cat: x.slug })} className={chip(cat === x.slug)}>
                {x.name}
              </Link>
            ))}
          </div>
          <div className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
            <Link href={href({ team: "" })} className={chip(!team)}>All teams</Link>
            {c.teams.filter((t) => t.count).map((t) => (
              <Link key={t.slug} href={href({ team: t.slug })} className={`${chip(team === t.slug)} flex items-center gap-2`}>
                <span className="h-2 w-2 rounded-full" style={{ background: t.color ?? "#111" }} />
                {t.name}
              </Link>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-1.5 text-[13px]">
            <span className="mr-1 text-faint">Sort</span>
            {SORTS.map(([k, l]) => (
              <Link key={k} href={href({ sort: k === "featured" ? "" : k })} className={chip(sort === k)} rel="nofollow">
                {l}
              </Link>
            ))}
            <Link href={href({ stock: inStock ? "" : "1" })} className={`${chip(inStock)} sm:ml-auto`} rel="nofollow">
              {inStock ? "✓ " : ""}In stock only
            </Link>
          </div>
        </div>
        <ProductGrid products={ps} empty="No products match these filters." />
      </section>
    </>
  );
}
