"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import { uploadImage, type Uploaded } from "../actions";
import { useMarkDirty } from "./save";

export const input = "w-full rounded-lg border border-rule bg-white px-3 py-2 text-sm outline-none focus:border-ink";
const IMAGE_TYPES = "image/png,image/jpeg,image/gif,image/webp,image/avif";

export type MediaLite = Uploaded;

export function Field({ label, hint, aside, children }: { label: string; hint?: React.ReactNode; aside?: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="flex items-baseline justify-between gap-3 text-sm font-medium">
        {label}
        {aside && <span className="font-mono text-xs font-normal">{aside}</span>}
      </span>
      {children}
      {hint && <span className="block text-xs text-ink-5">{hint}</span>}
    </label>
  );
}

export function Text({ name, label, hint, defaultValue, placeholder, type = "text", required }: { name: string; label: string; hint?: React.ReactNode; defaultValue?: string | number | null; placeholder?: string; type?: string; required?: boolean }) {
  return (
    <Field label={label} hint={hint}>
      <input name={name} type={type} defaultValue={defaultValue ?? ""} placeholder={placeholder} required={required} className={input} inputMode={type === "number" ? "numeric" : undefined} />
    </Field>
  );
}

export function Area({ name, label, hint, defaultValue, rows = 4, placeholder, mono }: { name: string; label: string; hint?: React.ReactNode; defaultValue?: string | null; rows?: number; placeholder?: string; mono?: boolean }) {
  return (
    <Field label={label} hint={hint}>
      <textarea name={name} rows={rows} defaultValue={defaultValue ?? ""} placeholder={placeholder} className={`${input} ${mono ? "font-mono text-[13px]" : ""}`} />
    </Field>
  );
}

export function Select({ name, label, hint, defaultValue, options, empty = "None" }: { name: string; label: string; hint?: React.ReactNode; defaultValue?: string | number | null; options: [value: string | number, label: string][]; empty?: string | null }) {
  return (
    <Field label={label} hint={hint}>
      <select name={name} defaultValue={defaultValue ?? ""} className={input}>
        {empty !== null && <option value="">{empty}</option>}
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </Field>
  );
}

export function Check({ name, label, hint, defaultChecked }: { name: string; label: string; hint?: string; defaultChecked?: boolean }) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5 text-sm">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="mt-0.5 h-4 w-4 accent-red" />
      <span>
        <span className="font-medium">{label}</span>
        {hint && <span className="block text-xs text-ink-5">{hint}</span>}
      </span>
    </label>
  );
}

/** Text field with a live count against a soft limit; search engines truncate past it. */
export function Counted({ name, label, hint, max, rows, defaultValue }: { name: string; label: string; hint?: string; max: number; rows?: number; defaultValue?: string | null }) {
  const [n, setN] = useState((defaultValue ?? "").length);
  const count = <span className={n > max ? "text-red" : "text-ink-5"}>{n} / {max}</span>;
  return (
    <Field label={label} hint={hint} aside={count}>
      {rows ? (
        <textarea name={name} rows={rows} defaultValue={defaultValue ?? ""} onInput={(e) => setN(e.currentTarget.value.length)} className={input} />
      ) : (
        <input name={name} defaultValue={defaultValue ?? ""} onInput={(e) => setN(e.currentTarget.value.length)} className={input} />
      )}
    </Field>
  );
}

/** Name + slug pair: a new item's slug follows the name until edited by hand. */
export function NameSlug({ name, slug, base, isNew }: { name: string; slug: string; base: string; isNew: boolean }) {
  const [n, setN] = useState(name);
  const [s, setS] = useState(slug);
  const [touched, setTouched] = useState(!isNew);
  const auto = (v: string) =>
    v
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80);
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Name">
        <input
          name="name"
          required
          value={n}
          onChange={(e) => {
            setN(e.target.value);
            if (!touched) setS(auto(e.target.value));
          }}
          className={input}
        />
      </Field>
      <Field label="URL slug" hint={<>{base}/<b>{s || "…"}</b>{!isNew && " · changing it breaks old links and search rankings"}</>}>
        <input
          name="slug"
          value={s}
          onChange={(e) => {
            setS(e.target.value);
            setTouched(true);
          }}
          className={`${input} font-mono`}
        />
      </Field>
    </div>
  );
}

/* ---------- images ---------- */

function useUpload(folder: string) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState("");
  const run = (files: FileList | null, done: (m: MediaLite) => void) => {
    if (!files?.length) return;
    start(async () => {
      setErr("");
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.set("file", file);
        fd.set("folder", folder);
        const r = await uploadImage(fd);
        if (r.media) done(r.media);
        else {
          setErr(r.error ?? "Upload failed.");
          break;
        }
      }
    });
  };
  return { pending, err, run };
}

function UploadButton({ pending, onFiles, multiple }: { pending: boolean; onFiles: (f: FileList | null) => void; multiple?: boolean }) {
  return (
    <label className={`cursor-pointer rounded-full border border-rule-strong bg-white px-3.5 py-1.5 text-sm font-medium whitespace-nowrap hover:border-ink ${pending ? "opacity-60" : ""}`}>
      {pending ? "Uploading…" : "Upload"}
      <input
        type="file"
        accept={IMAGE_TYPES}
        multiple={multiple}
        hidden
        disabled={pending}
        onChange={(e) => {
          onFiles(e.target.files);
          e.target.value = ""; // so picking the same file again still fires
        }}
      />
    </label>
  );
}

function Picker({ library, onPick, onClose }: { library: MediaLite[]; onPick: (m: MediaLite) => void; onClose: () => void }) {
  const [q, setQ] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  const shown = library.filter((m) => !q || `${m.name} ${m.alt}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} role="dialog" aria-label="Choose an image" className="flex max-h-[80vh] w-full max-w-3xl flex-col rounded-[14px] bg-white">
        <div className="flex items-center gap-3 border-b border-rule p-4">
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or alt text" className={input} />
          <button type="button" onClick={onClose} className="cursor-pointer text-sm underline">Close</button>
        </div>
        <div className="grid grid-cols-3 gap-3 overflow-y-auto p-4 sm:grid-cols-5">
          {shown.map((m) => (
            <button key={m.id} type="button" onClick={() => onPick(m)} className="group flex cursor-pointer flex-col gap-1 text-left">
              <span className="flex aspect-square items-center justify-center overflow-hidden rounded-lg border border-rule bg-paper group-hover:border-ink">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.src} alt={m.alt} loading="lazy" className="h-full w-full object-contain mix-blend-multiply" />
              </span>
              <span className="line-clamp-1 text-xs text-ink-5">{m.name}</span>
            </button>
          ))}
          {!shown.length && <p className="col-span-full py-8 text-center text-sm text-ink-5">No images found. Upload one instead.</p>}
        </div>
      </div>
    </div>
  );
}

/** One image (team logo, driver portrait, hero). Submits the media id as `name`. */
export function ImageField({ name, label, hint, initial, library, folder = "media" }: { name: string; label: string; hint?: string; initial: MediaLite | null; library: MediaLite[]; folder?: string }) {
  const [value, setValue] = useState<MediaLite | null>(initial);
  const [lib, setLib] = useState(library);
  const [picking, setPicking] = useState(false);
  const markDirty = useMarkDirty();
  const up = useUpload(folder);
  const set = (m: MediaLite | null) => {
    setValue(m);
    markDirty();
  };
  return (
    <div className="space-y-1.5">
      <span className="block text-sm font-medium">{label}</span>
      <input type="hidden" name={name} value={value?.id ?? ""} />
      <div className="flex flex-wrap items-center gap-3">
        <span className="stripes flex h-20 w-20 items-center justify-center overflow-hidden rounded-lg border border-rule bg-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {value && <img src={value.src} alt={value.alt} className="h-full w-full object-contain mix-blend-multiply" />}
        </span>
        <UploadButton pending={up.pending} onFiles={(f) => up.run(f, (m) => { setLib((l) => [m, ...l]); set(m); })} />
        <button type="button" onClick={() => setPicking(true)} className="cursor-pointer text-sm underline">Choose from library</button>
        {value && <button type="button" onClick={() => set(null)} className="cursor-pointer text-sm text-ink-5 underline hover:text-red">Remove</button>}
      </div>
      {up.err ? <p className="text-xs text-red">{up.err}</p> : hint && <p className="text-xs text-ink-5">{hint}</p>}
      {picking && <Picker library={lib} onClose={() => setPicking(false)} onPick={(m) => { set(m); setPicking(false); }} />}
    </div>
  );
}

/** Ordered product gallery. The first image is the main one. Submits JSON ids as `images`. */
export function ImagesField({ initial, library }: { initial: MediaLite[]; library: MediaLite[] }) {
  const [items, setItems] = useState(initial);
  const [lib, setLib] = useState(library);
  const [picking, setPicking] = useState(false);
  const markDirty = useMarkDirty();
  const up = useUpload("products");
  const update = (fn: (xs: MediaLite[]) => MediaLite[]) => {
    setItems(fn);
    markDirty();
  };
  const move = (i: number, d: number) =>
    update((xs) => {
      const j = i + d;
      if (j < 0 || j >= xs.length) return xs;
      const c = [...xs];
      [c[i], c[j]] = [c[j], c[i]];
      return c;
    });
  const id = useId();

  return (
    <div className="space-y-2" aria-labelledby={id}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span id={id} className="text-sm font-medium">Images <span className="font-normal text-ink-5">· upload multiple or add from library; first is the main photo</span></span>
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setPicking(true)} className="cursor-pointer text-sm underline">Add from library</button>
          <UploadButton multiple pending={up.pending} onFiles={(f) => up.run(f, (m) => { setLib((l) => [m, ...l]); update((xs) => [...xs, m]); })} />
        </div>
      </div>
      <input type="hidden" name="images" value={JSON.stringify(items.map((m) => m.id))} />
      {up.err && <p className="text-xs text-red">{up.err}</p>}
      {items.length ? (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
          {items.map((m, i) => (
            <div key={m.id} className={`group relative overflow-hidden rounded-lg border bg-paper ${i === 0 ? "border-ink" : "border-rule"}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={m.src} alt={m.alt} className="aspect-square w-full object-contain mix-blend-multiply" />
              {i === 0 && <span className="absolute top-1.5 left-1.5 rounded-full bg-ink px-2 py-0.5 text-[10px] font-semibold text-white">Main</span>}
              <div className="absolute inset-x-0 bottom-0 flex justify-between bg-white/90 px-1.5 py-1 text-xs opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
                <span className="flex gap-1">
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move left" className="cursor-pointer px-1 disabled:opacity-30">←</button>
                  <button type="button" onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label="Move right" className="cursor-pointer px-1 disabled:opacity-30">→</button>
                </span>
                <button type="button" onClick={() => update((xs) => xs.filter((x) => x.id !== m.id))} className="cursor-pointer px-1 text-red">Remove</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="rounded-lg border border-dashed border-rule-strong p-6 text-center text-sm text-ink-5">No images yet. Upload PNG, JPEG or WebP (max 4 MB). Photos on a white background look best.</p>
      )}
      <p className="text-xs text-ink-5">Alt text comes from each image&apos;s entry in Media; edit it there.</p>
      {picking && <Picker library={lib.filter((m) => !items.some((x) => x.id === m.id))} onClose={() => setPicking(false)} onPick={(m) => { update((xs) => [...xs, m]); setPicking(false); }} />}
    </div>
  );
}

/* ---------- variants ---------- */

export type VariantRow = { id: number | null; label: string | null; sku: string | null; price: number | null; stock: number | null };

const numOrNull = (s: string) => {
  const v = s.replace(/[, ]/g, "");
  if (v === "") return null;
  const n = Math.floor(Number(v));
  return Number.isFinite(n) ? n : null;
};

/** Variant rows with their own stock. Submits JSON as `variants`. */
export function VariantsEditor({ initial }: { initial: VariantRow[] }) {
  const [rows, setRows] = useState<(VariantRow & { key: string })[]>(() =>
    (initial.length ? initial : [{ id: null, label: null, sku: null, price: null, stock: null }]).map((r, i) => ({ ...r, key: `k${i}` })),
  );
  const markDirty = useMarkDirty();
  const update = (fn: (xs: typeof rows) => typeof rows) => {
    setRows(fn);
    markDirty();
  };
  const set = (key: string, patch: Partial<VariantRow>) => update((xs) => xs.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  const multi = rows.length > 1;
  const cell = "w-full rounded-md border border-rule bg-white px-2 py-1.5 text-sm outline-none focus:border-ink";

  return (
    <div className="space-y-2">
      <input type="hidden" name="variants" value={JSON.stringify(rows.map((r) => ({ id: r.id, label: r.label, sku: r.sku, price: r.price, stock: r.stock })))} />
      <div className="overflow-x-auto rounded-lg border border-rule">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="bg-paper">
            <tr>
              <th className="px-2 py-2 text-left text-xs font-medium text-ink-5">Option label {multi ? "" : "(optional)"}</th>
              <th className="px-2 py-2 text-left text-xs font-medium text-ink-5">SKU</th>
              <th className="px-2 py-2 text-left text-xs font-medium text-ink-5">Price override (Rs)</th>
              <th className="px-2 py-2 text-left text-xs font-medium text-ink-5">Stock</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key} className="border-t border-rule">
                <td className="p-1.5"><input value={r.label ?? ""} onChange={(e) => set(r.key, { label: e.target.value || null })} placeholder={multi ? "e.g. M, Kids, Red" : "none"} className={cell} /></td>
                <td className="p-1.5"><input value={r.sku ?? ""} onChange={(e) => set(r.key, { sku: e.target.value || null })} className={`${cell} font-mono`} /></td>
                <td className="p-1.5"><input value={r.price ?? ""} inputMode="numeric" onChange={(e) => set(r.key, { price: numOrNull(e.target.value) })} placeholder="product price" className={cell} /></td>
                <td className="p-1.5"><input value={r.stock ?? ""} inputMode="numeric" onChange={(e) => set(r.key, { stock: numOrNull(e.target.value) })} placeholder="not tracked" className={`${cell} ${r.stock === 0 ? "border-red text-red" : ""}`} /></td>
                <td className="p-1.5 text-center">
                  {multi && (
                    <button type="button" onClick={() => update((xs) => xs.filter((x) => x.key !== r.key))} aria-label="Remove variant" className="cursor-pointer text-ink-5 hover:text-red">✕</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => update((xs) => [...xs, { id: null, label: null, sku: null, price: null, stock: null, key: `n${Date.now()}` }])} className="cursor-pointer rounded-full border border-rule-strong bg-white px-3.5 py-1.5 text-sm font-medium hover:border-ink">
            + Add variant
          </button>
          <button type="button" onClick={() => update((xs) => xs.map((x) => ({ ...x, stock: 0 })))} className="cursor-pointer rounded-full border border-rule-strong bg-white px-3.5 py-1.5 text-sm font-medium hover:border-ink">
            Mark all sold out
          </button>
        </div>
        <span className="text-xs text-ink-5">0 = sold out. Empty stock = not tracked (always available). Empty price = product price.</span>
      </div>
    </div>
  );
}

/** Group of fields with a heading, used to break long editors into sections. */
export function Section({ title, children, aside }: { title: string; children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <section className="space-y-4 rounded-[14px] border border-rule bg-white p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-xl font-bold uppercase">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}
