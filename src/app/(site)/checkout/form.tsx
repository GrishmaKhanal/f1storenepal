"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import { quoteBag, submitOrder, type CheckoutState } from "@/app/actions/checkout";
import { Qty, useBag } from "@/components/bag";
import { emailSuggestion, isEmail } from "@/lib/email";
import { PROVINCES, provinceOf } from "@/lib/nepal";
import type { Quote } from "@/lib/pricing";
import { LocationField } from "./location";
import { forgetSaved, readSaved, writeSaved, type Saved } from "./saved";
import { input } from "./styles";

const rs = (n: number) => `Rs ${n.toLocaleString("en-IN")}`;

export function CheckoutForm({ freeOver, mapsKey, instagramDmUrl }: { freeOver: number | null; mapsKey: string | null; instagramDmUrl: string }) {
  const { items, setQty, remove, clear, ready } = useBag();
  const router = useRouter();
  // Last order's details on this device. Read on the first client render; the form
  // itself only shows once the bag is ready, so the server's empty render still matches.
  const [saved, setSaved] = useState<Saved | null>(readSaved);
  const [formKey, setFormKey] = useState(0);
  const [district, setDistrict] = useState(() => (saved && provinceOf(saved.district) ? saved.district : ""));
  const [province, setProvince] = useState(() => provinceOf(district) ?? "");
  const [address, setAddress] = useState(saved?.address ?? "");
  // What the map last filled in. A restored address counts too, so moving the pin to a new place replaces it.
  const [autoAddress, setAutoAddress] = useState(saved?.address ?? "");
  const placed = useRef<FormData | null>(null);
  const [q, setQ] = useState<Quote | null>(null);
  // Which district the current quote was priced for: right after a change it's still the old one.
  const [quotedFor, setQuotedFor] = useState("");
  const [state, dispatch, pending] = useActionState<CheckoutState, FormData>(submitOrder, undefined);
  const bagKey = items.map((i) => `${i.variantId}:${i.qty}`).join(",");

  // Re-price on the server whenever the bag or district changes.
  useEffect(() => {
    if (!ready) return;
    let live = true;
    quoteBag(items.map((i) => ({ variantId: i.variantId, qty: i.qty })), district || null).then((r) => {
      if (!live) return;
      setQ(r);
      setQuotedFor(district);
    });
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bagKey, district, ready]);

  useEffect(() => {
    if (state?.ok) {
      if (placed.current) writeSaved(placed.current);
      clear();
      router.replace(`/order/${state.token}`);
    }
  }, [state, clear, router]);

  if (!ready) return <div className="h-64 animate-pulse rounded-[20px] bg-white" />;
  // The bag is already cleared; hold this until the confirmation page takes over.
  if (state?.ok) {
    return (
      <div role="status" className="flex items-center justify-center gap-3 rounded-[20px] border border-rule bg-white p-10 text-[15px] font-semibold">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-red border-t-transparent" />
        Order placed. Opening your confirmation…
      </div>
    );
  }
  if (!items.length) {
    return (
      <div className="rounded-[20px] border border-rule bg-white p-10 text-center">
        <p className="mb-5 text-muted">Your bag is empty.</p>
        <Link href="/shop" className="rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white hover:bg-red hover:text-white">Browse the shop</Link>
      </div>
    );
  }

  const fee = q && quotedFor === district ? q : null; // null while the new district is being priced
  const problems = [...(q?.problems ?? []), ...(state && !state.ok ? (state.problems ?? []) : [])];
  const err = (k: string) => (state && !state.ok ? state.fields?.[k] : undefined);
  const priced = new Map(q?.lines.map((l) => [l.variantId, l]));

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("bag", JSON.stringify(items.map((i) => ({ variantId: i.variantId, qty: i.qty }))));
    placed.current = fd;
    startTransition(() => dispatch(fd));
  }

  // The pin's address goes into the address box, unless the customer has typed their own.
  function fillAddress(text: string) {
    if (address.trim() && address !== autoAddress) return;
    setAddress(text);
    setAutoAddress(text);
  }

  function forget() {
    forgetSaved();
    setSaved(null);
    setDistrict("");
    setProvince("");
    setAddress("");
    setAutoAddress("");
    setFormKey((k) => k + 1); // remount: clears the other fields and the map
  }

  return (
    <form key={formKey} onSubmit={onSubmit} method="post" className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-12">
      <div className="flex flex-col gap-8">
        <fieldset className="flex flex-col gap-4">
          <legend className="display mb-4 text-[28px]">YOUR DETAILS</legend>
          {saved && (
            <p className="-mt-2 rounded-[10px] bg-online/10 px-4 py-2.5 text-sm">
              Filled in from your last order on this device.{" "}
              <button type="button" onClick={forget} className="cursor-pointer font-semibold underline hover:text-red">
                Not you? Clear
              </button>
            </p>
          )}
          <Field label="Full name" name="customerName" err={err("customerName")} autoComplete="name" defaultValue={saved?.customerName} required />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Phone" name="phone" type="tel" err={err("phone")} autoComplete="tel" placeholder="98XXXXXXXX" defaultValue={saved?.phone} required />
            <EmailField err={err("email")} initial={saved?.email ?? ""} />
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-4">
          <legend className="display mb-4 text-[28px]">DELIVERY</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <Choice
              label="Province"
              name="province"
              value={province}
              placeholder="Choose province"
              err={err("province")}
              onChange={(v) => {
                setProvince(v);
                if (district && provinceOf(district) !== v) setDistrict("");
              }}
            >
              {PROVINCES.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name} Province
                </option>
              ))}
            </Choice>
            <Choice
              label="District"
              name="district"
              value={district}
              placeholder="Choose district"
              err={err("district")}
              onChange={(v) => {
                setDistrict(v);
                setProvince(provinceOf(v) ?? "");
              }}
            >
              {/* Every district until a province narrows the list; picking one fills in the province. */}
              {(province ? PROVINCES.filter((p) => p.name === province) : PROVINCES).map((p) => (
                <optgroup key={p.name} label={`${p.name} Province`}>
                  {p.districts.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </optgroup>
              ))}
            </Choice>
          </div>
          {(district || freeOver != null) && (
            <p className="-mt-2 text-xs text-faint">
              {district && fee && `Delivery to ${district}: ${fee.deliveryFee ? rs(fee.deliveryFee) : "Free"}. `}
              {freeOver != null && `Free delivery on orders over ${rs(freeOver)}.`}
            </p>
          )}
          <LocationField
            err={err("mapUrl")}
            mapsKey={mapsKey}
            district={district}
            province={province}
            initial={saved && { mapUrl: saved.mapUrl, mapAddress: saved.mapAddress }}
            onAddress={fillAddress}
            onDistrict={(d) => {
              setDistrict(d);
              setProvince(provinceOf(d) ?? "");
            }}
          />
          <div>
            <label htmlFor="f-address" className="mb-1.5 flex flex-wrap items-baseline justify-between gap-x-3 text-sm font-semibold">
              <span>
                Address
                <Required />
              </span>
              {address && address === autoAddress && address !== saved?.address && <span className="text-xs font-normal text-online">Filled in from your pin. Add your house, floor or tole.</span>}
            </label>
            <textarea
              id="f-address"
              name="address"
              rows={3}
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              autoComplete="street-address"
              placeholder="Town or municipality, tole, street, house"
              aria-invalid={!!err("address")}
              className={`${input} h-auto py-3`}
            />
            {err("address") && <p className="mt-1 text-xs text-red">{err("address")}</p>}
          </div>
          <Field label="Nearest landmark" name="landmark" err={err("landmark")} maxLength={200} defaultValue={saved?.landmark} placeholder="e.g. Opposite the bus park" />
          <Field label="Note for us" name="note" textarea placeholder="Gift wrap, best time to call…" />
        </fieldset>

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
                        {bad.reason === "stock" ? (bad.available ? `Only ${bad.available} left` : <a href={instagramDmUrl} target="_blank" rel="noopener noreferrer" className="underline">Sold out — DM us for a restock</a>) : bad.reason === "no-price" ? <a href={instagramDmUrl} target="_blank" rel="noopener noreferrer" className="underline">DM us on Instagram for pricing</a> : "No longer available"}
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
            <div className="flex justify-between"><dt>Delivery</dt><dd className="tabular-nums">{!district ? <span className="text-faint">Choose district</span> : fee ? (fee.deliveryFee ? rs(fee.deliveryFee) : "Free") : "…"}</dd></div>
            <div className="mt-2 flex justify-between text-lg font-semibold"><dt>Total</dt><dd className="tabular-nums">{!fee ? "…" : district ? rs(fee.total) : <>{rs(fee.subtotal)} <span className="text-sm font-normal text-faint">+ delivery</span></>}</dd></div>
          </dl>
        </div>
        {state && !state.ok && <p role="alert" className="rounded-[10px] bg-red/10 p-3 text-sm font-semibold text-red">{state.error}</p>}
        {problems.length > 0 && <p className="text-sm text-muted">Update or remove the flagged items to continue.</p>}
        <button disabled={pending || !fee || problems.length > 0 || !fee.lines.length} className="cursor-pointer rounded-full bg-red py-4 text-[15px] font-semibold text-white transition-colors hover:bg-red-hot disabled:cursor-not-allowed disabled:opacity-50">
          {pending ? "Placing order…" : !fee ? "Checking prices…" : district ? `Place order · ${rs(fee.total)}` : "Place order"}
        </button>
        <p className="text-center text-xs text-faint">Nothing to pay now. We&apos;ll call to confirm your order and how you&apos;d like to pay.</p>
        <p className="text-center text-xs text-faint">
          Rather order by DM? <a href={instagramDmUrl} target="_blank" rel="noopener noreferrer" className="underline">DM us on Instagram</a>
        </p>
      </aside>
    </form>
  );
}

/** Optional, but checked as soon as they leave the field, with a fix for common typos. */
function EmailField({ err, initial }: { err?: string; initial: string }) {
  const [value, setValue] = useState(initial);
  const [touched, setTouched] = useState(false);
  const v = value.trim();
  const wrong = !!v && !isEmail(v);
  const fix = v ? emailSuggestion(v) : null;
  const problem = (touched && wrong ? "That doesn't look like an email. It should be like name@gmail.com." : "") || err;
  return (
    <div>
      <label htmlFor="f-email" className="mb-1.5 block text-sm font-semibold">
        Email
      </label>
      <input
        id="f-email"
        name="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        autoCapitalize="none"
        spellCheck={false}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => setTouched(true)}
        // The browser blocks submitting a bad one too, with this message.
        onInvalid={(e) => e.currentTarget.setCustomValidity(wrong ? "Enter a valid email, like name@gmail.com, or leave it empty." : "")}
        onInput={(e) => e.currentTarget.setCustomValidity("")}
        pattern={wrong ? "^$" : undefined}
        aria-invalid={!!problem}
        aria-describedby="f-email-help"
        className={input}
      />
      <div id="f-email-help" aria-live="polite">
        {problem && <p className="mt-1 text-xs text-red">{problem}</p>}
        {fix && fix !== v.toLowerCase() && (
          <p className="mt-1 text-xs text-muted">
            Did you mean{" "}
            <button type="button" onClick={() => setValue(fix)} className="cursor-pointer font-semibold text-ink underline hover:text-red">
              {fix}
            </button>
            ?
          </p>
        )}
        {!problem && !fix && <p className="mt-1 text-xs text-faint">For your order confirmation.</p>}
      </div>
    </div>
  );
}

// Required fields get a red star; optional ones get no marking at all. The inputs
// carry `required` too, which is what screen readers and the browser go by.
function Required() {
  return (
    <span className="ml-0.5 text-red" aria-hidden>
      *
    </span>
  );
}

function Choice({ label, name, value, placeholder, err, onChange, children }: { label: string; name: string; value: string; placeholder: string; err?: string; onChange: (v: string) => void; children: React.ReactNode }) {
  const id = `f-${name}`;
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold">
        {label}
        <Required />
      </label>
      <div className="relative">
        <select id={id} name={name} value={value} onChange={(e) => onChange(e.target.value)} required aria-invalid={!!err} className={`${input} cursor-pointer appearance-none pr-10 [&_option]:text-ink ${value ? "" : "text-faint"}`}>
          <option value="" disabled>
            {placeholder}
          </option>
          {children}
        </select>
        <svg viewBox="0 0 24 24" className="pointer-events-none absolute top-1/2 right-4 h-4 w-4 -translate-y-1/2 text-faint" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>
      {err && <p className="mt-1 text-xs text-red">{err}</p>}
    </div>
  );
}

function Field({ label, name, err, textarea, ...rest }: { label: string; name: string; err?: string; textarea?: boolean } & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = `f-${name}`;
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold">
        {label}
        {rest.required && <Required />}
      </label>
      {textarea ? (
        <textarea id={id} name={name} rows={3} required={rest.required} placeholder={rest.placeholder} aria-invalid={!!err} className={`${input} h-auto py-3`} />
      ) : (
        <input id={id} name={name} aria-invalid={!!err} className={input} {...rest} />
      )}
      {err && <p className="mt-1 text-xs text-red">{err}</p>}
    </div>
  );
}
