"use client";

import { useEffect, useRef, useState } from "react";
import type { Img, VariantView } from "@/lib/data";
import { Qty, useBag } from "./bag";

const rs = (n: number) => `Rs ${n.toLocaleString("en-IN")}`;

export function Gallery({ images, name }: { images: Img[]; name: string }) {
  const [i, setI] = useState(0);
  const [direction, setDirection] = useState(1);
  const [zoomIndex, setZoomIndex] = useState<number | null>(null);
  const [zoomed, setZoomed] = useState(false);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const main = images[i];
  const zoomImage = zoomIndex == null ? null : images[zoomIndex];

  useEffect(() => {
    if (zoomIndex == null) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, [zoomIndex]);

  useEffect(() => {
    if (images.length < 2) return;
    const next = images[(i + 1) % images.length];
    const preload = new window.Image();
    preload.decoding = "async";
    preload.fetchPriority = "low";
    preload.srcset = next.srcSet;
    preload.sizes = "(min-width: 1024px) 640px, 100vw";
    preload.src = next.src;
  }, [images, i]);

  const go = (delta: number) => {
    if (images.length < 2) return;
    setDirection(delta);
    setI((current) => (current + delta + images.length) % images.length);
  };
  const closeZoom = () => {
    setZoomIndex(null);
    setZoomed(false);
  };
  const stepZoom = (delta: number) => {
    setZoomed(false);
    setZoomIndex((current) => current == null ? null : (current + delta + images.length) % images.length);
  };

  return (
    <div className="relative">
    <div
      role="region"
      aria-label={`${name} photos`}
      aria-roledescription="carousel"
      tabIndex={0}
      onTouchStart={(e) => { const touch = e.changedTouches[0]; touchStart.current = touch ? { x: touch.clientX, y: touch.clientY } : null; }}
      onTouchEnd={(e) => {
        const start = touchStart.current;
        const touch = e.changedTouches[0];
        touchStart.current = null;
        if (!start || !touch) return;
        const dx = touch.clientX - start.x;
        const dy = touch.clientY - start.y;
        if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
      }}
      onTouchCancel={() => { touchStart.current = null; }}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") { e.preventDefault(); go(-1); }
        if (e.key === "ArrowRight") { e.preventDefault(); go(1); }
      }}
      className="relative aspect-square overflow-hidden rounded-[20px] border border-rule bg-white touch-pan-y"
    >
      {main ? (
        <div key={main.src} role="group" aria-roledescription="slide" aria-label={`Image ${i + 1} of ${images.length}`} className={`relative flex h-full w-full items-center justify-center overflow-hidden ${direction > 0 ? "gallery-slide-from-right" : "gallery-slide-from-left"}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={main.src}
            srcSet={main.srcSet}
            sizes="(min-width: 1024px) 640px, 100vw"
            width={main.width}
            height={main.height}
            alt={main.alt || name}
            fetchPriority="high"
            decoding="async"
            className="h-full w-full scale-110 object-contain mix-blend-multiply"
          />
          <button type="button" onClick={() => { setZoomIndex(i); setZoomed(false); }} aria-label={`Zoom image ${i + 1}`} className="absolute right-3 bottom-3 z-10 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white/90 text-ink shadow-sm hover:bg-white">
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
              <path d="M8 3H3v5M16 3h5v5M21 16v5h-5M3 16v5h5" />
            </svg>
          </button>
          {images.length > 1 && (
            <>
              <button type="button" onClick={() => go(-1)} aria-label="Previous product image" className="absolute left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/90 text-2xl shadow-sm hover:bg-white">‹</button>
              <button type="button" onClick={() => go(1)} aria-label="Next product image" className="absolute right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/90 text-2xl shadow-sm hover:bg-white">›</button>
              <span aria-live="polite" className="absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-ink/75 px-3 py-1 text-xs text-white">{i + 1} / {images.length}</span>
            </>
          )}
        </div>
      ) : (
        <div className="stripes flex h-full w-full items-center justify-center font-mono text-xs text-ghost">Photo coming soon</div>
      )}
      </div>

      {zoomImage && zoomIndex != null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${name}, image ${zoomIndex + 1} of ${images.length}`}
          tabIndex={-1}
          onClick={closeZoom}
          onKeyDown={(e) => {
            if (e.key === "Escape") { e.stopPropagation(); closeZoom(); }
            if (e.key === "ArrowLeft") { e.preventDefault(); stepZoom(-1); }
            if (e.key === "ArrowRight") { e.preventDefault(); stepZoom(1); }
          }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
        >
          <button ref={closeRef} type="button" onClick={(e) => { e.stopPropagation(); closeZoom(); }} aria-label="Close image zoom" className="absolute top-4 right-4 z-10 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-white text-2xl text-ink">×</button>
          <button type="button" onClick={(e) => { e.stopPropagation(); setZoomed((current) => !current); }} aria-label={zoomed ? "Fit image to screen" : "Zoom in"} className="absolute top-4 right-20 z-10 cursor-pointer rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink">{zoomed ? "Fit" : "Zoom in"}</button>
          {images.length > 1 && (
            <>
              <button type="button" onClick={(e) => { e.stopPropagation(); stepZoom(-1); }} aria-label="Previous zoomed image" className="absolute left-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white text-2xl text-ink">‹</button>
              <button type="button" onClick={(e) => { e.stopPropagation(); stepZoom(1); }} aria-label="Next zoomed image" className="absolute right-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white text-2xl text-ink">›</button>
            </>
          )}
          <div className="max-h-[90vh] max-w-[90vw] overflow-auto" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={zoomImage.large}
              width={zoomImage.width}
              height={zoomImage.height}
              alt={zoomImage.alt || `${name}, image ${zoomIndex + 1}`}
              fetchPriority="high"
              className={`block h-auto ${zoomed ? "max-h-none max-w-none cursor-zoom-out" : "max-h-[85vh] max-w-[90vw] cursor-zoom-in"}`}
              style={zoomed ? { width: "min(140vw, 1600px)" } : undefined}
              onClick={() => setZoomed((current) => !current)}
            />
          </div>
          {images.length > 1 && <span className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-ink">{zoomIndex + 1} / {images.length}</span>}
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
