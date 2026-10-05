"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useActionState, useEffect, useState } from "react";
import { quoteBag, submitOrder, type CheckoutState } from "@/app/actions/checkout";
import { Qty, useBag } from "@/components/bag";
import type { PaymentMethod, Zone } from "@/db/schema";
import type { Quote } from "@/lib/pricing";

const rs = (n: number) => `Rs ${n.toLocaleString("en-IN")}`;
const input = "h-12 w-full rounded-[10px] border border-rule bg-white px-4 text-[15px] outline-none transition-colors focus:border-ink aria-[invalid=true]:border-red";

export function CheckoutForm({ zones, freeOver, payments, instagramUrl }: { zones: Zone[]; freeOver: number | null; payments: PaymentMethod[]; instagramUrl: string | null }) {
  const { items, setQty, remove, clear, ready } = useBag();
  const router = useRouter();
  const [zone, setZone] = useState(zones[0]?.name ?? "");
  const [pay, setPay] = useState(payments[0]?.key ?? "");
  const [q, setQ] = useState<Quote | null>(null);
  const [state, dispatch, pending] = useActionState<CheckoutState, FormData>(submitOrder, undefined);
  const bagKey = items.map((i) => `${i.variantId}:${i.qty}`).join(",");

  // Re-price on the server whenever the bag or delivery area changes.
  useEffect(() => {
    if (!ready) return;
    let live = true;
    quoteBag(items.map((i) => ({ variantId: i.variantId, qty: i.qty })), zone || null).then((r) => live && setQ(r));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bagKey, zone, ready]);

  useEffect(() => {
    if (state?.ok) {
      clear();
      router.replace(`/order/${state.token}`);
    }
  }, [state, clear, router]);

  if (!ready) return <div className="h-64 animate-pulse rounded-[20px] bg-white" />;
  if (!items.length && !state?.ok) {
    return (
      <div className="rounded-[20px] border border-rule bg-white p-10 text-center">
        <p className="mb-5 text-muted">Your bag is empty.</p>
        <Link href="/shop" className="rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white hover:bg-red hover:text-white">Browse the shop</Link>
      </div>
    );
  }

  const problems = [...(q?.problems ?? []), ...(state && !state.ok ? (state.problems ?? []) : [])];
  const err = (k: string) => (state && !state.ok ? state.fields?.[k] : undefined);
  const priced = new Map(q?.lines.map((l) => [l.variantId, l]));

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("bag", JSON.stringify(items.map((i) => ({ variantId: i.variantId, qty: i.qty }))));
    startTransition(() => dispatch(fd));
  }

  return (
    <form onSubmit={onSubmit} method="post" className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-12">
      <div className="flex flex-col gap-8">
        <fieldset className="flex flex-col gap-4">
          <legend className="display mb-4 text-[28px]">YOUR DETAILS</legend>
          <Field label="Full name" name="customerName" err={err("customerName")} autoComplete="name" required />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Phone" name="phone" type="tel" err={err("phone")} autoComplete="tel" placeholder="98XXXXXXXX" required />
            <Field label="Email (optional)" name="email" type="email" err={err("email")} autoComplete="email" />
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-4">
          <legend className="display mb-4 text-[28px]">DELIVERY</legend>
          {zones.length > 0 && (
            <div>
              <span className="mb-2 block text-sm font-semibold">Delivery area</span>
              <div className="grid gap-2 sm:grid-cols-2">
                {zones.map((z) => (
                  <label key={z.name} className={`flex cursor-pointer items-center justify-between gap-3 rounded-[10px] border bg-white px-4 py-3 text-sm transition-colors ${zone === z.name ? "border-ink" : "border-rule hover:border-ink"}`}>
                    <span className="flex items-center gap-3">
                      <input type="radio" name="deliveryZone" value={z.name} checked={zone === z.name} onChange={() => setZone(z.name)} className="accent-red" />
                      {z.name}
                    </span>
                    <span className="tabular-nums text-faint">{z.fee ? rs(z.fee) : "Free"}</span>
                  </label>
                ))}
              </div>
              {freeOver != null && <p className="mt-2 text-xs text-faint">Free delivery on orders over {rs(freeOver)}.</p>}
            </div>
          )}
          <Field label="City / district" name="city" err={err("city")} autoComplete="address-level2" required />
          <Field label="Address" name="address" err={err("address")} autoComplete="street-address" textarea required placeholder="Tole, street, landmark" />
          <Field label="Note for us (optional)" name="note" textarea placeholder="Gift wrap, best time to call…" />
        </fieldset>

        {payments.length > 0 && (
          <fieldset>
            <legend className="display mb-4 text-[28px]">PAYMENT</legend>
            <div className="flex flex-col gap-2">
              {payments.map((p) => (
                <label key={p.key} className={`flex cursor-pointer flex-col gap-1 rounded-[10px] border bg-white px-4 py-3 text-sm transition-colors ${pay === p.key ? "border-ink" : "border-rule hover:border-ink"}`}>
                  <span className="flex items-center gap-3 font-semibold">
                    <input type="radio" name="paymentMethod" value={p.key} checked={pay === p.key} onChange={() => setPay(p.key)} className="accent-red" />
                    {p.label}
                  </span>
                  {pay === p.key && p.instructions && <span className="pl-7 text-faint">{p.instructions}</span>}
                </label>
              ))}
            </div>
            <p className="mt-3 text-xs text-faint">No payment is taken on this site. We confirm every order with you first.</p>
          </fieldset>
        )}
        {/* Honeypot: hidden from people, irresistible to bots. */}
        <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="absolute -left-[9999px] h-0 w-0 opacity-0" />
      </div>

      <aside className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-[20px] border border-rule bg-white p-6">
          <h2 className="display mb-4 text-[28px]">ORDER</h2>
          <ul className="divide-y divide-rule">
            {items.map((it) => {
              const l = priced.get(it.variantId);
              const bad = problems.find((p) => p.variantId === it.variantId);
              return (
                <li key={it.variantId} className="flex gap-3 py-3">
                  <div className="stripes h-16 w-16 flex-none overflow-hidden rounded-lg border border-rule bg-white">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {it.image && <img src={it.image} alt="" className="h-full w-full object-contain mix-blend-multiply" />}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-1 text-sm">
                    <span className="leading-snug font-semibold">{it.name}</span>
                    {it.variantLabel && <span className="text-xs text-faint">{it.variantLabel}</span>}
                    {bad && (
                      <span className="text-xs font-semibold text-red">
                        {bad.reason === "stock" ? (bad.available ? `Only ${bad.available} left` : "Sold out") : bad.reason === "no-price" ? "Not available online" : "No longer available"}
                      </span>
                    )}
                    <div className="flex items-center justify-between">
                      <Qty value={it.qty} onChange={(n) => setQty(it.variantId, n)} />
                      <button type="button" onClick={() => remove(it.variantId)} className="text-xs text-faint underline hover:text-red">Remove</button>
                    </div>
                  </div>
                  <span className="text-sm tabular-nums">{rs((l?.unitPrice ?? it.price) * it.qty)}</span>
                </li>
              );
            })}
          </ul>
          <dl className="mt-3 flex flex-col gap-1.5 border-t border-rule pt-4 text-sm">
            <div className="flex justify-between"><dt>Subtotal</dt><dd className="tabular-nums">{q ? rs(q.subtotal) : "…"}</dd></div>
            <div className="flex justify-between"><dt>Delivery</dt><dd className="tabular-nums">{q ? (q.deliveryFee ? rs(q.deliveryFee) : "Free") : "…"}</dd></div>
            <div className="mt-2 flex justify-between text-lg font-semibold"><dt>Total</dt><dd className="tabular-nums">{q ? rs(q.total) : "…"}</dd></div>
          </dl>
        </div>
        {state && !state.ok && <p role="alert" className="rounded-[10px] bg-red/10 p-3 text-sm font-semibold text-red">{state.error}</p>}
        {problems.length > 0 && <p className="text-sm text-muted">Update or remove the flagged items to continue.</p>}
        <button disabled={pending || !q || problems.length > 0 || !q.lines.length} className="cursor-pointer rounded-full bg-red py-4 text-[15px] font-semibold text-white transition-colors hover:bg-red-hot disabled:cursor-not-allowed disabled:opacity-50">
          {pending ? "Placing order…" : q ? `Place order · ${rs(q.total)}` : "Checking prices…"}
        </button>
        {instagramUrl && (
          <p className="text-center text-xs text-faint">
            Rather order by DM? <a href={instagramUrl} target="_blank" rel="noopener" className="underline">Message us on Instagram</a>
          </p>
        )}
      </aside>
    </form>
  );
}

function Field({ label, name, err, textarea, ...rest }: { label: string; name: string; err?: string; textarea?: boolean } & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = `f-${name}`;
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold">{label}</label>
      {textarea ? (
        <textarea id={id} name={name} rows={3} required={rest.required} placeholder={rest.placeholder} aria-invalid={!!err} className={`${input} h-auto py-3`} />
      ) : (
        <input id={id} name={name} aria-invalid={!!err} className={input} {...rest} />
      )}
      {err && <p className="mt-1 text-xs text-red">{err}</p>}
    </div>
  );
}
