import Link from "next/link";
import type { ProductView } from "@/lib/data";
import { rs } from "@/lib/money";
import { paths } from "@/lib/site";
import { QuickAdd } from "./bag";
import { Img } from "./Img";

export function ProductCard({ p, priority }: { p: ProductView; priority?: boolean }) {
  const img = p.images[0];
  const single = p.variants.length === 1 ? p.variants[0] : null;
  const meta = [p.team?.name ?? p.category?.name, p.scale].filter(Boolean).join(" · ");
  const fromPrice = minPrice(p);

  return (
    <article className="group relative flex flex-col gap-3">
      <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-[14px] border border-rule bg-white transition-colors group-hover:border-ink">
        {img ? (
          <Img img={img} sizes="(min-width: 1280px) 320px, (min-width: 640px) 45vw, 90vw" priority={priority} className="h-full w-full scale-[1.12] object-contain mix-blend-multiply transition-transform duration-500 ease-out-soft group-hover:scale-[1.2]" />
        ) : (
          <div className="stripes absolute inset-0 flex items-center justify-center font-mono text-[11px] text-ghost">{p.team?.name ?? "F1 Store Nepal"}</div>
        )}
        {(p.badge || !p.inStock) && (
          <span className={`absolute top-3 left-3 rounded-full px-2.5 py-[5px] text-[11px] font-semibold tracking-[.04em] text-white ${p.inStock ? "bg-ink" : "bg-faint"}`}>
            {p.inStock ? p.badge : "Sold out"}
          </span>
        )}
        {single?.available && single.price != null && (
          <QuickAdd
            label={`Add ${p.name} to bag`}
            item={{ variantId: single.id, slug: p.slug, name: p.name, variantLabel: single.label, price: single.price, image: img?.src ?? null }}
          />
        )}
      </div>
      <div className="flex flex-col gap-1 px-0.5">
        {meta && (
          <span className="flex items-center gap-2 text-xs text-faint">
            <span className="h-2 w-2 rounded-full" style={{ background: p.team?.color ?? "#111" }} />
            {meta}
          </span>
        )}
        <h3 className="text-[15px] leading-[1.35] font-semibold">
          {/* The whole card is clickable through this link's pseudo-element. */}
          <Link href={paths.product(p.slug)} className="after:absolute after:inset-0 after:content-[''] hover:text-red">
            {p.name}
          </Link>
        </h3>
        <span className="text-[15px] tabular-nums">
          {fromPrice == null ? <span className="text-faint">Ask on Instagram</span> : <>{p.variants.length > 1 && new Set(p.variants.map((v) => v.price)).size > 1 ? "From " : ""}{rs(fromPrice)}</>}
          {p.compareAtPrice != null && fromPrice != null && p.compareAtPrice > fromPrice && <s className="ml-2 text-faint">{rs(p.compareAtPrice)}</s>}
        </span>
      </div>
    </article>
  );
}

export function minPrice(p: ProductView): number | null {
  const ps = p.variants.map((v) => v.price).filter((x): x is number => x != null);
  return ps.length ? Math.min(...ps) : p.price;
}

export function ProductGrid({ products, empty = "Nothing here yet. Check back soon, or ask us on Instagram." }: { products: ProductView[]; empty?: string }) {
  if (!products.length) return <p className="rounded-[14px] border border-dashed border-rule p-10 text-center text-muted">{empty}</p>;
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-4 md:grid-cols-[repeat(auto-fill,minmax(250px,1fr))]">
      {products.map((p, i) => (
        <ProductCard key={p.id} p={p} priority={i < 4} />
      ))}
    </div>
  );
}
