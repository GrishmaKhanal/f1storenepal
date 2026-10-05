import type { Metadata } from "next";
import { PageHead, wrap } from "@/components/chrome";
import { ProductGrid } from "@/components/ProductCard";
import { getProducts } from "@/lib/data";

export const metadata: Metadata = { title: "Search", robots: { index: false, follow: true } };

const norm = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "");

export default async function Search({ searchParams }: PageProps<"/search">) {
  const raw = (await searchParams).q;
  const q = (Array.isArray(raw) ? raw[0] : raw)?.trim().slice(0, 80) ?? "";
  const words = norm(q).split(/\s+/).filter(Boolean);
  const results = words.length
    ? (await getProducts()).filter((p) => {
        const hay = norm([p.name, p.team?.name, p.driver?.name, p.driver?.number, p.category?.name, p.brand, p.scale].filter(Boolean).join(" "));
        return words.every((w) => hay.includes(w));
      })
    : [];
  return (
    <>
      <PageHead crumbs={[["Search", "/search"]]} title={q ? `“${q}”` : "Search"} intro={q ? `${results.length} result${results.length === 1 ? "" : "s"}` : null}>
        <form action="/search" role="search" className="flex w-full gap-2 sm:w-auto">
          <input name="q" defaultValue={q} placeholder="Search cars, caps, drivers…" aria-label="Search products" className="h-12 min-w-0 flex-1 rounded-full border border-ink bg-white px-5 text-sm outline-none sm:w-[320px]" />
          <button className="h-12 cursor-pointer rounded-full bg-ink px-6 text-sm font-semibold text-white hover:bg-red">Search</button>
        </form>
      </PageHead>
      <section className={`${wrap} pb-[72px]`}>
        <ProductGrid products={results} empty={q ? "Nothing matched. Try a team or driver name, or ask us on Instagram." : "Type a team, driver or product."} />
      </section>
    </>
  );
}
