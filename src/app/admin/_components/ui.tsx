import Link from "next/link";

export const title = "font-display text-[clamp(34px,5vw,46px)] leading-none font-extrabold uppercase";
export const newBtn = "rounded-full bg-ink px-4 py-2 text-sm font-semibold whitespace-nowrap text-white hover:bg-red hover:text-white";
export const card = "rounded-[14px] border border-rule bg-white";
export const th = "px-3 py-2.5 text-left text-xs font-medium text-ink-5";
export const td = "px-3 py-2.5 align-middle";

/** Page title with an optional back link above and actions on the right. */
export function PageHeader({ children, back, actions }: { children: React.ReactNode; back?: [label: string, href: string]; actions?: React.ReactNode }) {
  return (
    <div className="mb-6">
      {back && (
        <Link href={back[1]} className="mb-3 inline-block text-[13px] font-medium text-ink-4 hover:text-red">
          ← {back[0]}
        </Link>
      )}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className={title}>{children}</h1>
        {actions}
      </div>
    </div>
  );
}

export function StatusPill({ live, on = "Live", off = "Hidden" }: { live: boolean; on?: string; off?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 font-mono text-xs ${live ? "text-ink" : "text-ink-5"}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${live ? "bg-online" : "border border-ink-6"}`} />
      {live ? on : off}
    </span>
  );
}

const ORDER_COLORS: Record<string, string> = {
  new: "bg-red text-white",
  confirmed: "bg-amber-100 text-amber-900",
  paid: "bg-sky-100 text-sky-900",
  shipped: "bg-indigo-100 text-indigo-900",
  delivered: "bg-green-100 text-green-900",
  cancelled: "bg-[#eee] text-ink-5 line-through",
};

export function OrderPill({ status }: { status: string }) {
  return <span className={`rounded-full px-2 py-0.5 font-mono text-[11px] capitalize ${ORDER_COLORS[status] ?? ""}`}>{status}</span>;
}

/** Filter chips driven by a query param, e.g. ?status=draft. */
export function Filters({ items, current }: { items: [key: string, label: string, n: number, href: string][]; current: string }) {
  return (
    <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Filter">
      {items.map(([key, label, n, href]) => (
        <Link
          key={key}
          href={href}
          aria-current={key === current ? "true" : undefined}
          className={`rounded-full border px-3 py-1 text-xs font-medium ${key === current ? "border-ink bg-ink text-white hover:text-white" : "border-rule-strong bg-white hover:border-ink"}`}
        >
          {label} <span className="opacity-60">{n}</span>
        </Link>
      ))}
    </div>
  );
}

export function Thumb({ src }: { src: string | null }) {
  return (
    <span className="stripes flex h-11 w-11 flex-none items-center justify-center overflow-hidden rounded-lg border border-rule bg-white">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {src && <img src={src} alt="" className="h-full w-full object-contain mix-blend-multiply" />}
    </span>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="rounded-[14px] border border-dashed border-rule-strong p-8 text-center text-sm text-ink-5">{children}</p>;
}
