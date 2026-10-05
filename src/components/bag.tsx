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
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

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
    clearTimeout(timer.current);
    setToast(`${item.name}${item.variantLabel ? ` (${item.variantLabel})` : ""} added to bag`);
    timer.current = setTimeout(() => setToast(""), 2400);
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      items,
      count: items.reduce((s, x) => s + x.qty, 0),
      subtotal: items.reduce((s, x) => s + x.qty * x.price, 0),
      add,
      setQty: (id, qty) => setItems((xs) => (qty <= 0 ? xs.filter((x) => x.variantId !== id) : xs.map((x) => (x.variantId === id ? { ...x, qty: Math.min(MAX_QTY, qty) } : x)))),
      remove: (id) => setItems((xs) => xs.filter((x) => x.variantId !== id)),
      clear: () => setItems([]),
      open,
      setOpen,
      ready,
    }),
    [items, add, open, ready],
  );

  return (
    <BagCtx.Provider value={value}>
      {children}
      <BagDrawer />
      <div
        aria-live="polite"
        className={`pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2 transition-all duration-300 ease-out-soft ${toast ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"}`}
      >
        {toast && (
          <div className="flex items-center gap-2.5 rounded-full bg-ink px-5 py-3.5 text-sm text-white shadow-lg">
            <span className="text-red">●</span>
            {toast}
          </div>
        )}
      </div>
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
  const { items, open, setOpen, setQty, remove, subtotal } = useBag();
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
                <li key={it.variantId} className="flex gap-4 py-4">
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
                  <button onClick={() => remove(it.variantId)} className="self-start text-xs text-faint underline hover:text-red" aria-label={`Remove ${it.name}`}>
                    Remove
                  </button>
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
