import Link from "next/link";
import type { Settings } from "@/lib/data";
import { abs } from "@/lib/site";
import { JsonLd } from "./JsonLd";
import { InstagramIcon } from "./MegaNav";

export const wrap = "mx-auto max-w-[1320px] px-4 sm:px-6";

export function Strip({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <div className="flex flex-col items-center justify-center gap-x-7 gap-y-0.5 bg-ink sm:flex-row sm:flex-wrap px-6 py-[9px] text-center text-[12.5px] tracking-[.04em] text-paper">
      {items.map((t, i) => (
        <span key={i} className="flex items-center gap-7">
          {i > 0 && <span className="hidden text-red sm:inline" aria-hidden>●</span>}
          {t}
        </span>
      ))}
    </div>
  );
}

export function Footer({ s }: { s: Settings }) {
  const [first, ...rest] = s.storeName.toUpperCase().split(" ");
  return (
    <footer className="bg-night text-dim">
      <div className={`${wrap} flex flex-wrap justify-between gap-8 py-12 text-sm`}>
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/logo.jpeg" alt="" width={56} height={56} loading="lazy" className="h-14 w-14 rounded-full" />
            <span className="display text-[22px] text-paper">
              {first} <span className="text-red">{rest.join(" ")}</span>
              {s.tagline && (
                <>
                  <br />
                  <span className="font-sans text-[13px] font-normal text-faint">{s.tagline}</span>
                </>
              )}
            </span>
          </div>
          {s.location && (
            <address className="text-[13px] not-italic text-faint">
              {s.streetAddress && <>{s.streetAddress}, </>}
              {s.location}
              {s.phone && (
                <>
                  <br />
                  <a href={`tel:${s.phone.replace(/\s/g, "")}`} className="hover:text-paper">{s.phone}</a>
                </>
              )}
            </address>
          )}
        </div>
        <div className="flex flex-wrap gap-12">
          <FooterCol title="Shop" links={[["By Driver", "/drivers"], ["By Team", "/teams"], ["Accessories", "/accessories"], ["New In", "/new"]]} />
          <FooterCol title="Help" links={[["Delivery", "/delivery"], ["Returns", "/returns"], ["Contact", "/contact"]]} />
          {s.instagramUrl && (
            <div className="flex flex-col gap-2">
              <span className="font-semibold text-paper">Follow</span>
              <a href={s.instagramUrl} target="_blank" rel="noopener" className="flex items-center gap-2 text-dim hover:text-paper">
                <InstagramIcon size={15} /> {s.instagramHandle ?? "Instagram"}
              </a>
            </div>
          )}
        </div>
      </div>
      {s.footerDisclaimer && <div className="border-t border-[#222] px-6 py-4 text-center text-xs text-[#6d6963]">{s.footerDisclaimer}</div>}
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="font-semibold text-paper">{title}</span>
      {links.map(([l, h]) => (
        <Link key={h} href={h} className="text-dim hover:text-paper">
          {l}
        </Link>
      ))}
    </div>
  );
}

/** Visible breadcrumb trail plus BreadcrumbList JSON-LD. */
export function Crumbs({ items }: { items: [label: string, href: string][] }) {
  const all: [string, string][] = [["Home", "/"], ...items];
  return (
    <>
      <nav aria-label="Breadcrumb" className="mb-4 text-[13px] text-faint">
        <ol className="flex flex-wrap items-center gap-1.5">
          {all.map(([l, h], i) => (
            <li key={h} className="flex items-center gap-1.5">
              {i > 0 && <span aria-hidden>/</span>}
              {i === all.length - 1 ? <span aria-current="page" className="text-ink">{l}</span> : <Link href={h} className="hover:text-red">{l}</Link>}
            </li>
          ))}
        </ol>
      </nav>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: all.map(([name, h], i) => ({ "@type": "ListItem", position: i + 1, name, item: abs(h) })),
        }}
      />
    </>
  );
}

export function PageHead({ crumbs, title, intro, accent, children }: { crumbs: [string, string][]; title: string; intro?: string | null; accent?: string | null; children?: React.ReactNode }) {
  return (
    <div className={`${wrap} pt-8 pb-8 sm:pt-10`}>
      <Crumbs items={crumbs} />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="rise">
          {accent && <span className="mb-4 block h-1.5 w-12 rounded" style={{ background: accent }} />}
          <h1 className="display text-[clamp(44px,7vw,80px)] uppercase italic">{title}</h1>
          {intro && <p className="mt-4 max-w-[560px] text-[16px] leading-relaxed text-muted">{intro}</p>}
        </div>
        {children}
      </div>
    </div>
  );
}

export function SectionHead({ title, href, link, children }: { title: string; href?: string; link?: string; children?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <h2 className="display text-[clamp(34px,4vw,44px)]">{title}</h2>
      {href && link && (
        <Link href={href} className="border-b border-current pb-0.5 text-sm font-semibold">
          {link}
        </Link>
      )}
      {children}
    </div>
  );
}

/** "Order on Instagram" call to action used on product and collection pages. */
export function InstagramCta({ url, handle, text }: { url: string | null; handle: string | null; text: string }) {
  if (!url) return null;
  return (
    <a href={url} target="_blank" rel="noopener" className="flex items-center gap-3 rounded-[14px] border border-rule bg-white p-4 text-sm transition-colors hover:border-ink hover:text-ink">
      <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-ink text-white">
        <InstagramIcon />
      </span>
      <span>
        <span className="block font-semibold">{text}</span>
        <span className="text-faint">DM {handle ?? "us on Instagram"}</span>
      </span>
    </a>
  );
}

/** Plain-text paragraphs from a settings field (blank line = new paragraph). */
export function Paras({ text, className = "" }: { text: string | null; className?: string }) {
  if (!text) return null;
  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {text.split(/\n{2,}/).map((p, i) => (
        <p key={i} className="whitespace-pre-line">{p}</p>
      ))}
    </div>
  );
}
