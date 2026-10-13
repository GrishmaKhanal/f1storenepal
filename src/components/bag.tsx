"use client";

import Link from "next/link";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

// The bag lives in the browser (localStorage). Each line keeps a display snapshot so
// the drawer renders instantly; checkout re-prices everything on the server.
export type BagItem = {
  variantId: number;
  qty: number;
  slug: string;
  name: string;
  variantLabel: string | null;
  price: number;
  image: string | null;
};

const KEY = "f1sn-bag-v1";
const MAX_QTY = 10;

type Ctx = {
  items: BagItem[];
  count: number;
  subtotal: number;
  add: (item: Omit<BagItem, "qty">, qty?: number) => void;
  setQty: (variantId: number, qty: number) => void;
  remove: (variantId: number) => void;
  clear: () => void;
  open: boolean;
  setOpen: (o: boolean) => void;
  ready: boolean;
  // The line just added, so the drawer can call it out. n changes on every add.
  added: { variantId: number; name: string; n: number } | null;
};

const BagCtx = createContext<Ctx | null>(null);

export function useBag() {
  const c = useContext(BagCtx);
  if (!c) throw new Error("useBag outside BagProvider");
  return c;
}

const rs = (n: number) => `Rs ${n.toLocaleString("en-IN")}`;

function read(): BagItem[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(v) ? v.filter((x) => x && Number.isInteger(x.variantId) && x.qty > 0) : [];
  } catch {
    return [];
  }
}

export function BagProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<BagItem[]>([]);
  const [ready, setReady] = useState(false);
  const [open, setOpenRaw] = useState(false);
  const [added, setAdded] = useState<Ctx["added"]>(null);

  useEffect(() => {
    // localStorage is only readable after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems(read());
    setReady(true);
    const onStorage = (e: StorageEvent) => e.key === KEY && setItems(read());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch {}
  }, [items, ready]);

  const add = useCallback((item: Omit<BagItem, "qty">, qty = 1) => {
    setItems((xs) => {
      const hit = xs.find((x) => x.variantId === item.variantId);
      if (hit) return xs.map((x) => (x === hit ? { ...item, qty: Math.min(MAX_QTY, x.qty + qty) } : x));
      return [...xs, { ...item, qty: Math.min(MAX_QTY, qty) }];
    });
    setAdded((a) => ({ variantId: item.variantId, name: `${item.name}${item.variantLabel ? ` (${item.variantLabel})` : ""}`, n: (a?.n ?? 0) + 1 }));
    setOpenRaw(true);
  }, []);

  // Opening the bag yourself shows it plainly, without the last "added" callout.
  const setOpen = useCallback((o: boolean) => {
    if (o) setAdded(null);
    setOpenRaw(o);
  }, []);

  // Stable, and a no-op on an empty bag: checkout calls it from an effect that lists it
  // as a dependency, so a fresh function or a fresh [] each time would loop.
  const clear = useCallback(() => setItems((xs) => (xs.length ? [] : xs)), []);

  const value = useMemo<Ctx>(
    () => ({
      items,
      count: items.reduce((s, x) => s + x.qty, 0),
      subtotal: items.reduce((s, x) => s + x.qty * x.price, 0),
      add,
      setQty: (id, qty) => setItems((xs) => (qty <= 0 ? xs.filter((x) => x.variantId !== id) : xs.map((x) => (x.variantId === id ? { ...x, qty: Math.min(MAX_QTY, qty) } : x)))),
      remove: (id) => setItems((xs) => xs.filter((x) => x.variantId !== id)),
      clear,
      open,
      setOpen,
      ready,
      added,
    }),
    [items, add, clear, open, setOpen, ready, added],
  );

  return (
    <BagCtx.Provider value={value}>
      {children}
      <BagDrawer />
    </BagCtx.Provider>
  );
}

export function BagButton() {
  const { count, setOpen, ready } = useBag();
  return (
    <button
      onClick={() => setOpen(true)}
      className="flex h-[42px] cursor-pointer items-center gap-2 rounded-full bg-ink px-4 text-[13.5px] font-semibold text-white transition-colors hover:bg-red sm:px-[18px]"
      aria-label={`Bag, ${count} item${count === 1 ? "" : "s"}`}
    >
      Bag
      <span className="inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-full bg-red px-1 text-xs tabular-nums">{ready ? count : 0}</span>
    </button>
  );
}

function BagDrawer() {
  const { items, open, setOpen, setQty, remove, subtotal, added } = useBag();
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, setOpen]);

  return (
    <div className={`fixed inset-0 z-40 ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
      <div onClick={() => setOpen(false)} className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`} />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label="Your bag"
        tabIndex={-1}
        className={`absolute top-0 right-0 flex h-full w-full max-w-[420px] flex-col bg-white shadow-2xl outline-none transition-transform duration-300 ease-out-soft ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex items-center justify-between border-b border-rule px-6 py-5">
          <h2 className="display text-[30px]">YOUR BAG</h2>
          <button onClick={() => setOpen(false)} className="h-10 w-10 cursor-pointer rounded-full border border-rule text-lg hover:border-ink" aria-label="Close bag">
            ✕
          </button>
        </div>
        <div role="status">
          {added && (
            <div key={added.n} className="bag-banner flex items-center gap-2.5 border-b border-online/20 bg-online/10 px-6 py-3 text-sm">
              <span className="flex h-5 w-5 flex-none items-center justify-center rounded-full bg-online text-white" aria-hidden>
                <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
              </span>
              <span className="min-w-0 truncate">
                <span className="font-semibold text-online">Added to bag</span> · {added.name}
              </span>
            </div>
          )}
        </div>
        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
            <p className="text-muted">Your bag is empty.</p>
            <Link href="/shop" onClick={() => setOpen(false)} className="rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white hover:bg-red hover:text-white">
              Start shopping
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-rule overflow-y-auto px-6">
              {items.map((it) => (
                <li key={added?.variantId === it.variantId ? `${it.variantId}-${added.n}` : it.variantId} className={`-mx-6 flex gap-4 px-6 py-4 ${added?.variantId === it.variantId ? "bag-added" : ""}`}>
                  <Link href={`/products/${it.slug}`} onClick={() => setOpen(false)} className="stripes flex h-20 w-20 flex-none items-center justify-center overflow-hidden rounded-[10px] border border-rule bg-white">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {it.image && <img src={it.image} alt="" className="h-full w-full object-contain mix-blend-multiply" />}
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <Link href={`/products/${it.slug}`} onClick={() => setOpen(false)} className="text-[14.5px] leading-snug font-semibold hover:text-red">
                      {it.name}
                    </Link>
                    {it.variantLabel && <span className="text-xs text-faint">{it.variantLabel}</span>}
                    <div className="mt-auto flex items-center justify-between">
                      <Qty value={it.qty} onChange={(q) => setQty(it.variantId, q)} />
                      <span className="text-sm tabular-nums">{rs(it.price * it.qty)}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end justify-between">
                    <button onClick={() => remove(it.variantId)} className="cursor-pointer text-xs text-faint underline hover:text-red" aria-label={`Remove ${it.name}`}>
                      Remove
                    </button>
                    {added?.variantId === it.variantId && (
                      <span className="bag-tick flex h-6 w-6 items-center justify-center rounded-full bg-online text-white" title="Added" aria-hidden>
                        <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
            <div className="border-t border-rule px-6 py-5">
              <div className="mb-1 flex justify-between font-semibold">
                <span>Subtotal</span>
                <span className="tabular-nums">{rs(subtotal)}</span>
              </div>
              <p className="mb-4 text-xs text-faint">Delivery is calculated at checkout.</p>
              <Link href="/checkout" onClick={() => setOpen(false)} className="block rounded-full bg-red py-4 text-center text-[15px] font-semibold text-white hover:bg-red-hot hover:text-white">
                Checkout
              </Link>
              <button onClick={() => setOpen(false)} className="mt-2 w-full cursor-pointer rounded-full py-3 text-center text-sm font-semibold hover:text-red">
                Keep shopping
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function Qty({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="inline-flex items-center rounded-full border border-rule">
      <button type="button" onClick={() => onChange(value - 1)} className="h-8 w-8 cursor-pointer text-lg leading-none hover:text-red" aria-label="Decrease quantity">
        −
      </button>
      <span className="w-6 text-center text-sm tabular-nums">{value}</span>
      <button type="button" onClick={() => onChange(Math.min(MAX_QTY, value + 1))} className="h-8 w-8 cursor-pointer text-lg leading-none hover:text-red" aria-label="Increase quantity">
        +
      </button>
    </div>
  );
}

/** Round "+" on product cards: adds the only variant, or opens the product to pick one. */
export function QuickAdd({ item, label }: { item: Omit<BagItem, "qty">; label: string }) {
  const { add } = useBag();
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        add(item);
      }}
      aria-label={label}
      className="absolute right-3 bottom-3 z-10 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-red text-[22px] leading-none text-white transition-all duration-200 hover:scale-105 hover:bg-ink"
    >
      +
    </button>
  );
}

/** Big hero button. */
export function HeroAdd({ item, children, className }: { item: Omit<BagItem, "qty">; children: React.ReactNode; className: string }) {
  const { add } = useBag();
  return (
    <button type="button" onClick={() => add(item)} className={className}>
      {children}
    </button>
  );
}
