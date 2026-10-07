"use client";

import { useState } from "react";
import type { Img, VariantView } from "@/lib/data";
import { Qty, useBag } from "./bag";

const rs = (n: number) => `Rs ${n.toLocaleString("en-IN")}`;

export function Gallery({ images, name }: { images: Img[]; name: string }) {
  const [i, setI] = useState(0);
  const main = images[i];
  return (
    <div className="flex flex-col gap-3">
      <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-[20px] border border-rule bg-white">
        {main ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={main.src} src={main.src} srcSet={main.srcSet} sizes="(min-width: 1024px) 640px, 100vw" width={main.width} height={main.height} alt={main.alt || name} fetchPriority="high" className="rise h-full w-full scale-110 object-contain mix-blend-multiply" />
        ) : (
          <div className="stripes absolute inset-0 flex items-center justify-center font-mono text-xs text-ghost">Photo coming soon</div>
        )}
      </div>
      {images.length > 1 && (
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          {images.map((im, j) => (
            <button key={im.src} type="button" onClick={() => setI(j)} aria-label={`Show image ${j + 1}`} aria-pressed={i === j} className={`h-20 w-20 flex-none cursor-pointer overflow-hidden rounded-[10px] border bg-white transition-colors ${i === j ? "border-ink" : "border-rule hover:border-ink"}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={im.src} alt="" loading="lazy" className="h-full w-full object-contain mix-blend-multiply" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function BuyBox({ product, variants, lowStock, instagramDmUrl }: { product: { slug: string; name: string; image: string | null }; variants: VariantView[]; lowStock: number; instagramDmUrl: string }) {
  const { add } = useBag();
  const named = variants.filter((v) => v.label);
  const firstAvailable = variants.find((v) => v.available) ?? variants[0];
  const [vid, setVid] = useState(firstAvailable?.id);
  const [qty, setQty] = useState(1);
  const v = variants.find((x) => x.id === vid) ?? firstAvailable;
  if (!v) return null;
  const max = v.stock == null ? 10 : Math.min(10, v.stock);

  return (
    <div className="flex flex-col gap-5">
      <div className="text-[28px] font-semibold tabular-nums">{v.price != null ? rs(v.price) : <a href={instagramDmUrl} target="_blank" rel="noopener noreferrer" className="text-faint underline">DM us for price</a>}</div>

      {named.length > 0 && (
        <fieldset>
          <legend className="mb-2 text-sm font-semibold">Option</legend>
          <div className="flex flex-wrap gap-2">
            {named.map((x) => (
              <button
                key={x.id}
                type="button"
                onClick={() => {
                  setVid(x.id);
                  setQty(1);
                }}
                aria-pressed={x.id === v.id}
                disabled={!x.available}
                className={`min-w-14 cursor-pointer rounded-full border px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:text-ghost disabled:line-through ${x.id === v.id ? "border-ink bg-ink text-white" : "border-[#d9d6d0] bg-white hover:border-ink"}`}
              >
                {x.label}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      <StockNote v={v} lowStock={lowStock} instagramDmUrl={instagramDmUrl} />

      {v.available && v.price != null ? (
        <div className="flex flex-wrap items-center gap-3">
          <Qty value={qty} onChange={(n) => setQty(Math.max(1, Math.min(max, n)))} />
          <button
            type="button"
            onClick={() => add({ variantId: v.id, slug: product.slug, name: product.name, variantLabel: v.label, price: v.price!, image: product.image }, qty)}
            className="flex-1 cursor-pointer rounded-full bg-red px-7 py-4 text-[15px] font-semibold whitespace-nowrap text-white transition-colors hover:bg-red-hot sm:flex-none"
          >
            Add to bag · {rs(v.price * qty)}
          </button>
        </div>
      ) : (
        <a href={instagramDmUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center rounded-full bg-red px-7 py-4 text-[15px] font-semibold text-white transition-colors hover:bg-red-hot">
          {v.price == null ? "DM us on Instagram" : "DM us about a restock"} ↗
        </a>
      )}
    </div>
  );
}

function StockNote({ v, lowStock, instagramDmUrl }: { v: VariantView; lowStock: number; instagramDmUrl: string }) {
  if (v.stock == null) return <p className="flex items-center gap-2 text-sm text-muted"><Dot c="#1a9b4b" /> Available</p>;
  if (v.stock <= 0) return <p className="flex items-center gap-2 text-sm text-muted"><Dot c="#9a958d" /> <a href={instagramDmUrl} target="_blank" rel="noopener noreferrer" className="underline">Sold out. DM us to ask about a restock.</a></p>;
  if (v.stock <= lowStock) return <p className="flex items-center gap-2 text-sm font-semibold text-red"><Dot c="#e10600" /> Only {v.stock} left</p>;
  return <p className="flex items-center gap-2 text-sm text-muted"><Dot c="#1a9b4b" /> In stock</p>;
}

const Dot = ({ c }: { c: string }) => <span className="h-2 w-2 rounded-full" style={{ background: c }} />;
