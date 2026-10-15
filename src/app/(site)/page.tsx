import type { Metadata } from "next";
import Link from "next/link";
import { HeroAdd } from "@/components/bag";
import { SectionHead, wrap } from "@/components/chrome";
import { Img } from "@/components/Img";
import { JsonLd } from "@/components/JsonLd";
import { InstagramIcon } from "@/components/MegaNav";
import { NewInTabs } from "@/components/NewInTabs";
import { ProductCard } from "@/components/ProductCard";
import { getCatalog, getNewest, getProducts, getSettings, type Settings } from "@/lib/data";
import { rs } from "@/lib/money";
import { abs, paths, SITE_URL } from "@/lib/site";

export const metadata: Metadata = { alternates: { canonical: "/" } };

export default async function Home() {
  const [s, c, newest, all] = await Promise.all([getSettings(), getCatalog(), getNewest(40), getProducts()]);
  const heroProduct = all.find((p) => p.id === s.heroProductId) ?? null;
  const featured = c.drivers.filter((d) => d.featured);
  const accessories = c.categories.filter((x) => x.isAccessory && x.count > 0);
  const tabs = c.categories.filter((x) => x.showAsTab).map((x) => ({ key: x.slug, label: x.name }));

  return (
    <>
      <StoreJsonLd s={s} />
      <Hero s={s} product={heroProduct} />

      {newest.length > 0 && (
        <section className={`${wrap} pt-8 sm:pt-12`}>
          <SectionHead title="NEW IN" href="/new" link="See everything new" />
          <NewInTabs
            tabs={tabs}
            items={newest.map((p, i) => ({
              id: p.id,
              cats: p.category ? [p.category.slug] : [],
              node: <ProductCard p={p} priority={i < 2} />,
            }))}
          />
        </section>
      )}

      {c.teams.length > 0 && (
        <section className={`${wrap} pt-[72px]`}>
          <SectionHead title="SHOP BY TEAM" href="/teams" link="All teams" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(180px,1fr))]">
            {c.teams.map((t) => (
              <Link key={t.slug} href={paths.team(t.slug)} className="group overflow-hidden rounded-[14px] border border-rule bg-white transition-all duration-200 ease-out-soft hover:-translate-y-[3px] hover:border-ink hover:text-ink">
                <span className="relative flex aspect-[4/1] items-center justify-center overflow-hidden px-2">
                  {t.logo ? <Img img={t.logo} sizes="(max-width: 640px) 50vw, 220px" alt={`${t.name} 2026 Formula 1 car`} className="h-full w-full object-contain transition-transform duration-300 ease-out-soft group-hover:scale-105" /> : <span className="h-1.5 w-11 rounded-[3px]" style={{ background: t.color ?? "#111" }} />}
                </span>
                <span className="flex items-end justify-between gap-2 border-t border-rule px-[18px] py-3.5">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: t.color ?? "#111" }} />
                    <span className="font-display text-[23px] leading-none font-bold">{t.name}</span>
                  </span>
                  {t.count > 0 && <span className="font-mono text-[11px] text-ghost">{t.count}</span>}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {featured.length > 0 && (
        <section className={`${wrap} pt-[72px]`}>
          <SectionHead title="SHOP BY DRIVER" href="/drivers" link={`All ${c.drivers.length} drivers`} />
          <div className="no-scrollbar -mx-4 grid snap-x snap-mandatory scroll-px-4 sm:scroll-px-0 auto-cols-[minmax(180px,1fr)] grid-flow-col gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:auto-cols-[minmax(200px,1fr)] sm:px-0">
            {featured.map((d) => (
              <Link key={d.slug} href={paths.driver(d.slug)} className="group flex snap-start flex-col overflow-hidden rounded-[14px] border border-rule bg-white transition-colors hover:border-ink hover:text-ink">
                <div className="stripes relative flex aspect-[4/5] items-end overflow-hidden p-3.5">
                  {d.portrait && <Img img={d.portrait} sizes="220px" alt={d.name} className="absolute inset-0 h-full w-full object-cover object-top origin-top transition-transform duration-500 ease-out-soft group-hover:scale-105" />}
                  <span className="display absolute top-2.5 right-3.5 text-[64px] italic" style={{ color: d.team?.color ?? "#111" }}>
                    {d.number}
                  </span>
                </div>
                <div className="flex flex-col gap-[3px] px-4 pt-3.5 pb-4">
                  <span className="font-display text-[22px] leading-none font-bold">{d.name}</span>
                  <span className="text-[12.5px] text-faint">{d.team?.name}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className={`${wrap} pt-[72px]`}>
        <SectionHead title="ACCESSORIES" href={accessories.length > 0 ? "/accessories" : undefined} link={accessories.length > 0 ? "All accessories" : undefined} />
        {accessories.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(200px,1fr))]">
            {accessories.map((a) => (
              <Link key={a.slug} href={paths.category(a.slug)} className="flex aspect-[1.2] flex-col justify-between rounded-[14px] bg-ink p-5 text-paper transition-colors duration-200 hover:bg-red hover:text-white">
                <span className="font-mono text-[11px] opacity-70">
                  {a.count} item{a.count === 1 ? "" : "s"}
                </span>
                <span className="font-display text-[28px] leading-none font-bold">{a.name}</span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-[14px] border border-rule bg-white px-5 py-8 text-center font-display text-xl text-faint">Coming soon</div>
        )}
      </section>

      {s.serviceAreas.length > 0 && (
        <section className={`${wrap} pt-[72px]`}>
          <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] md:items-end">
            <div>
              <h2 className="display text-[clamp(34px,4vw,44px)]">F1 MERCH, DELIVERED ACROSS NEPAL</h2>
              <p className="mt-4 max-w-[520px] text-[15.5px] leading-relaxed text-muted">
                Looking for an F1 store near you? {s.storeName} delivers Formula 1 diecast cars, wall posters and gifts to your door, wherever you are in Nepal.
              </p>
            </div>
            <ul aria-label="Towns we deliver to" className="flex flex-wrap gap-2">
              {s.serviceAreas.map((a) => (
                <li key={a} className="rounded-full border border-rule bg-white px-3.5 py-1.5 text-sm">{a}</li>
              ))}
              <li className="rounded-full bg-ink px-3.5 py-1.5 text-sm text-paper">and everywhere else in Nepal</li>
            </ul>
          </div>
        </section>
      )}

      {s.steps.length > 0 && (
        <section className={`${wrap} pt-[72px]`}>
          <div className="grid gap-8 rounded-[20px] border border-rule bg-white p-7 sm:grid-cols-[repeat(auto-fit,minmax(220px,1fr))] sm:p-9">
            {s.steps.map((st, i) => (
              <div key={i} className="flex flex-col gap-2">
                <span className="font-mono text-xs text-red">{String(i + 1).padStart(2, "0")}</span>
                <span className="text-base font-semibold">{st.title}</span>
                <span className="text-sm leading-normal text-muted">{st.body}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {s.instagramUrl && (
        <section className={`${wrap} py-[72px]`}>
          <a href={s.instagramUrl} target="_blank" rel="noopener" className="group flex flex-wrap items-center justify-between gap-6 rounded-[20px] bg-night p-8 text-paper transition-colors hover:text-paper sm:p-10">
            <div>
              <div className="font-mono text-xs tracking-[.12em] text-red">FOLLOW THE PADDOCK</div>
              <div className="display mt-3 text-[clamp(36px,5vw,56px)] italic">{s.instagramHandle ?? "INSTAGRAM"}</div>
              <p className="mt-2 text-sm text-dim">New arrivals, restocks and unboxings. DM us to order.</p>
            </div>
            <span className="flex items-center gap-2 rounded-full bg-red px-6 py-4 text-[15px] font-semibold text-white transition-transform group-hover:scale-[1.03]">
              <InstagramIcon /> Follow on Instagram
            </span>
          </a>
        </section>
      )}
      {!s.instagramUrl && <div className="pb-[72px]" />}
    </>
  );
}

function Hero({ s, product }: { s: Settings; product: Awaited<ReturnType<typeof getProducts>>[number] | null }) {
  if (!s.heroTitle) return null;
  const img = s.heroImage ?? product?.images[0] ?? null;
  const v = product?.variants.length === 1 ? product.variants[0] : null;
  const canAdd = product && v?.available && v.price != null;
  const dark = s.heroStyle !== "light";
  const flush = dark && img; // dark style: the image sits on the hero's bottom edge
  const title = s.heroTitle.split("\n").map((line, i, a) => (
    <span key={i}>
      {line.split(/(\*[^*]+\*)/).map((part, j) => (part.startsWith("*") && part.endsWith("*") ? <span key={j} className="text-red">{part.slice(1, -1)}</span> : part))}
      {i < a.length - 1 && <> <br /></>}
    </span>
  ));

  const btn = "rounded-full px-[22px] py-3 text-[14.5px] font-semibold whitespace-nowrap";
  const primary = canAdd ? (
    <HeroAdd
      item={{ variantId: v!.id, slug: product!.slug, name: product!.name, variantLabel: v!.label, price: v!.price!, image: img?.src ?? null }}
      className={`${btn} cursor-pointer text-white transition-colors ${dark ? "bg-red hover:bg-red-hot" : "bg-ink hover:bg-red"}`}
    >
      Add to bag · {rs(v!.price!)}
    </HeroAdd>
  ) : product ? (
    <Link href={paths.product(product.slug)} className={`${btn} bg-red text-white hover:bg-red-hot hover:text-white`}>
      View product
    </Link>
  ) : null;
  const secondary = s.heroSecondaryLabel && s.heroSecondaryHref && (
    <Link href={s.heroSecondaryHref} className={`${btn} border transition-colors ${dark ? "border-[#3a3a3a] text-paper hover:border-paper hover:text-paper" : "border-[#d9d6d0] hover:border-ink"}`}>
      {s.heroSecondaryLabel}
    </Link>
  );
  const cta = (s.heroBody || primary || secondary) && (
    <div className={`flex flex-wrap items-center gap-x-8 gap-y-3 ${img ? "mt-4" : ""}`}>
      {s.heroBody && <p className={`max-w-[460px] text-[14.5px] leading-snug sm:text-[15.5px] ${dark ? "text-dim" : "text-muted"}`}>{s.heroBody}</p>}
      {(primary || secondary) && <div className="flex flex-wrap gap-2.5">{primary}{secondary}</div>}
    </div>
  );

  return (
    <section className={dark ? "overflow-hidden bg-night text-paper" : "overflow-hidden border-b border-rule bg-white"}>
      <div
        className={`${wrap} grid gap-x-12 gap-y-4 ${flush ? "pt-5 sm:pt-8" : "py-5 sm:py-8"} ${img ? `md:grid-cols-[minmax(0,1fr)_auto] ${dark ? "items-end" : "md:items-center"}` : "lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] lg:items-end"}`}
      >
        <div className={`rise min-w-0 ${flush ? "md:pb-8" : ""}`}>
          {s.heroEyebrow && <div className="font-mono text-[11px] tracking-[.12em] text-red uppercase sm:text-xs">{s.heroEyebrow}</div>}
          <h1 className={`display mt-2 text-[clamp(32px,4.4vw,56px)] leading-[.9] text-balance uppercase ${dark ? "tracking-[-.01em] italic" : ""}`}>{title}</h1>
          {img && cta}
        </div>
        {!img && cta}
        {img && (
          <div className="relative justify-self-center md:justify-self-end">
            {flush && s.heroWatermark && (
              <div aria-hidden className="display absolute -right-8 -bottom-6 text-[clamp(150px,16vw,240px)] text-[#1a1a1a] italic select-none">
                {s.heroWatermark}
              </div>
            )}
            <div className={`relative flex aspect-[1.5] w-[240px] items-center justify-center overflow-hidden bg-paper sm:w-[280px] lg:w-[320px] ${dark ? "rounded-t-[14px]" : "rounded-[14px]"}`}>
              <Img img={img} priority sizes="(min-width: 1024px) 320px, (min-width: 640px) 280px, 240px" className={`max-w-none mix-blend-multiply ${dark ? "w-[138%]" : "w-[115%]"}`} />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function StoreJsonLd({ s }: { s: Settings }) {
  const [locality, country] = (s.location ?? "").split(",").map((x) => x.trim());
  return (
    <JsonLd
      data={[
        {
          "@context": "https://schema.org",
          "@type": "Store",
          "@id": `${SITE_URL}/#store`,
          name: s.storeName,
          alternateName: "F1 Store Nepal",
          url: SITE_URL,
          logo: abs("/icons/icon-512.png"),
          image: abs("/opengraph-image.png"),
          description: s.seoDescription ?? undefined,
          slogan: s.tagline ?? undefined,
          telephone: s.phone ?? undefined,
          email: s.email ?? undefined,
          currenciesAccepted: "NPR",
          paymentAccepted: s.paymentMethods.map((p) => p.label).join(", ") || undefined,
          areaServed: [{ "@type": "Country", name: "Nepal" }, ...s.serviceAreas.map((name) => ({ "@type": "Place", name }))],
          address: s.location
            ? { "@type": "PostalAddress", streetAddress: s.streetAddress ?? undefined, addressLocality: locality, addressCountry: country === "Nepal" || !country ? "NP" : country }
            : undefined,
          sameAs: [s.instagramUrl].filter(Boolean),
        },
        {
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: s.storeName,
          // Google's site-name fallbacks, most preferred first.
          alternateName: ["F1 Store Nepal", new URL(SITE_URL).host],
          url: SITE_URL,
          potentialAction: { "@type": "SearchAction", target: `${SITE_URL}/search?q={search_term_string}`, "query-input": "required name=search_term_string" },
        },
      ]}
    />
  );
}
