"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { wordmark } from "@/lib/wordmark";
import { BagButton } from "./bag";

export type NavData = {
  storeName: string;
  logo: string;
  instagramUrl: string | null;
  drivers: { slug: string; name: string; number: number | null }[];
  teams: { slug: string; name: string; color: string | null }[];
  accessories: { slug: string; name: string; count: number }[];
};

type Menu = "d" | "t" | "a" | null;

export function MegaNav({ data }: { data: NavData }) {
  const [menu, setMenu] = useState<Menu>(null);
  const [mobile, setMobile] = useState(false);
  const [search, setSearch] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const header = useRef<HTMLElement>(null);
  const [head, last] = wordmark(data.storeName);

  // Close everything on navigation.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMenu(null);
    setMobile(false);
    setSearch(false);
  }, [pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenu(null);
        setSearch(false);
      }
    };
    const onDown = (e: PointerEvent) => {
      if (!header.current?.contains(e.target as Node)) setMenu(null);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, []);

  const trigger = (key: Exclude<Menu, null>, label: string) => (
    <button
      type="button"
      aria-expanded={menu === key}
      onMouseEnter={() => setMenu(key)}
      onClick={() => setMenu(menu === key ? null : key)}
      className={`cursor-pointer border-b-2 bg-transparent px-3 py-[26px] text-[14.5px] font-semibold whitespace-nowrap transition-colors ${menu === key ? "border-red" : "border-transparent hover:border-red"}`}
    >
      {label}
    </button>
  );

  return (
    <header ref={header} onMouseLeave={() => setMenu(null)} className="sticky top-0 z-30 border-b border-rule bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
      <div className="mx-auto flex h-[72px] max-w-[1320px] items-center gap-4 px-4 sm:gap-5 sm:px-6">
        <button type="button" onClick={() => setMobile((m) => !m)} className="-ml-1 flex h-10 w-10 cursor-pointer flex-col items-center justify-center gap-[5px] lg:hidden" aria-label="Menu" aria-expanded={mobile}>
          <span className={`h-[2px] w-5 bg-ink transition-transform ${mobile ? "translate-y-[7px] rotate-45" : ""}`} />
          <span className={`h-[2px] w-5 bg-ink transition-opacity ${mobile ? "opacity-0" : ""}`} />
          <span className={`h-[2px] w-5 bg-ink transition-transform ${mobile ? "-translate-y-[7px] -rotate-45" : ""}`} />
        </button>
        <Link href="/" className="flex flex-shrink-0 items-center gap-3 hover:text-ink" aria-label={`${data.storeName} home`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={data.logo} alt="" width={46} height={46} className="h-[46px] w-[46px] rounded-full object-cover" />
          <span className="display hidden text-[22px] tracking-[.02em] sm:inline">
            {head}
            <span className="text-red"> {last}</span>
          </span>
        </Link>

        <nav aria-label="Shop" className="no-scrollbar hidden min-w-0 flex-1 overflow-x-auto lg:flex">
          {trigger("d", "Shop by Driver")}
          {trigger("t", "Shop by Team")}
          {data.accessories.length > 0 && trigger("a", "Accessories")}
          <Link href="/new" onMouseEnter={() => setMenu(null)} className="px-3 py-[26px] text-[14.5px] font-semibold whitespace-nowrap text-red hover:text-ink">
            New In
          </Link>
          <Link href="/shop" onMouseEnter={() => setMenu(null)} className="px-3 py-[26px] text-[14.5px] font-semibold whitespace-nowrap">
            Shop all
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-2.5">
          {search ? (
            <form
              role="search"
              onSubmit={(e) => {
                e.preventDefault();
                const q = new FormData(e.currentTarget).get("q")?.toString().trim();
                if (q) router.push(`/search?q=${encodeURIComponent(q)}`);
              }}
              className="flex items-center"
            >
              <input
                name="q"
                autoFocus
                placeholder="Search cars, caps, drivers…"
                aria-label="Search products"
                onBlur={(e) => !e.currentTarget.value && setSearch(false)}
                className="h-[42px] w-[min(56vw,260px)] rounded-full border border-ink bg-white px-4 text-sm outline-none"
              />
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setSearch(true)}
              aria-label="Search"
              className="flex h-[42px] w-[42px] flex-shrink-0 cursor-pointer items-center justify-center rounded-full border border-[#e2dfda] bg-[#f2f1ee] transition-colors hover:border-ink"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden>
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
            </button>
          )}
          {data.instagramUrl && !search && (
            <a href={data.instagramUrl} target="_blank" rel="noopener" aria-label="Instagram" className="hidden h-[42px] w-[42px] items-center justify-center rounded-full border border-[#e2dfda] transition-colors hover:border-ink sm:flex">
              <InstagramIcon />
            </a>
          )}
          <BagButton />
        </div>
      </div>

      {/* Desktop mega-menus */}
      <div className={`absolute inset-x-0 top-full hidden border-b border-rule bg-white shadow-[0_24px_40px_-24px_rgba(0,0,0,.18)] transition-all duration-200 ease-out-soft lg:block ${menu ? "visible translate-y-0 opacity-100" : "invisible -translate-y-1 opacity-0"}`}>
        <div className="mx-auto grid max-w-[1320px] grid-cols-[200px_1fr] gap-10 px-6 pt-7 pb-8">
          {menu === "d" && (
            <>
              <MenuIntro title={["SHOP BY", "DRIVER"]} body="Every car, cap and keyring for the grid." href="/drivers" link="All drivers" />
              <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-x-5 gap-y-1">
                {data.drivers.map((d) => (
                  <Link key={d.slug} href={`/drivers/${d.slug}`} className="flex items-baseline gap-2.5 border-b border-[#f0eee9] py-2 text-sm hover:text-red">
                    <span className="w-5 font-mono text-[11px] text-ghost">{d.number}</span>
                    {d.name}
                  </Link>
                ))}
              </div>
            </>
          )}
          {menu === "t" && (
            <>
              <MenuIntro title={["SHOP BY", "TEAM"]} body={`${data.teams.length} constructors. Pick your colours.`} href="/teams" link="All teams" />
              <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-2.5">
                {data.teams.map((t) => (
                  <Link key={t.slug} href={`/teams/${t.slug}`} className="flex items-center gap-3 rounded-[10px] border border-rule-2 px-3.5 py-3 text-sm font-semibold transition-colors hover:border-ink hover:text-ink">
                    <span className="h-[26px] w-1.5 rounded-sm" style={{ background: t.color ?? "#111" }} />
                    {t.name}
                  </Link>
                ))}
              </div>
            </>
          )}
          {menu === "a" && data.accessories.length > 0 && (
            <>
              <MenuIntro title={["ACCESS-", "ORIES"]} body="Gifts and garage pieces." href="/accessories" link="All accessories" />
              <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-2.5">
                {data.accessories.map((a) => (
                  <Link key={a.slug} href={`/accessories/${a.slug}`} className="flex flex-col gap-1 rounded-[10px] border border-rule-2 p-3.5 transition-colors hover:border-ink hover:text-ink">
                    <span className="text-sm font-semibold">{a.name}</span>
                    <span className="text-xs text-faint">
                      {a.count} item{a.count === 1 ? "" : "s"}
                    </span>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`fixed inset-x-0 top-[73px] bottom-0 overflow-y-auto bg-white transition-all duration-300 ease-out-soft lg:hidden ${mobile ? "visible opacity-100" : "invisible opacity-0"}`}>
        <div className="flex flex-col gap-8 px-4 py-6">
          <div className="flex gap-2">
            <Link href="/new" className="rounded-full bg-red px-4 py-2 text-sm font-semibold text-white">New In</Link>
            <Link href="/shop" className="rounded-full border border-ink px-4 py-2 text-sm font-semibold">Shop all</Link>
          </div>
          <MobileGroup title="Shop by Team" href="/teams">
            {data.teams.map((t) => (
              <Link key={t.slug} href={`/teams/${t.slug}`} className="flex items-center gap-3 py-2.5 text-[15px] font-semibold">
                <span className="h-5 w-1.5 rounded-sm" style={{ background: t.color ?? "#111" }} />
                {t.name}
              </Link>
            ))}
          </MobileGroup>
          <MobileGroup title="Shop by Driver" href="/drivers">
            {data.drivers.map((d) => (
              <Link key={d.slug} href={`/drivers/${d.slug}`} className="flex items-baseline gap-2.5 py-2.5 text-[15px]">
                <span className="w-6 font-mono text-[11px] text-ghost">{d.number}</span>
                {d.name}
              </Link>
            ))}
          </MobileGroup>
          {data.accessories.length > 0 && (
            <MobileGroup title="Accessories" href="/accessories">
              {data.accessories.map((a) => (
                <Link key={a.slug} href={`/accessories/${a.slug}`} className="py-2.5 text-[15px] font-semibold">
                  {a.name} <span className="font-normal text-faint">· {a.count}</span>
                </Link>
              ))}
            </MobileGroup>
          )}
          {data.instagramUrl && (
            <a href={data.instagramUrl} target="_blank" rel="noopener" className="flex items-center gap-2 font-semibold">
              <InstagramIcon /> Follow us on Instagram
            </a>
          )}
        </div>
      </div>
    </header>
  );
}

function MenuIntro({ title, body, href, link }: { title: [string, string]; body: string; href: string; link: string }) {
  return (
    <div>
      <div className="display text-[30px]">
        {title[0]}
        <br />
        {title[1]}
      </div>
      <p className="mt-3 text-[13.5px] leading-normal text-muted">{body}</p>
      <Link href={href} className="mt-4 inline-block border-b border-current pb-0.5 text-[13px] font-semibold">
        {link}
      </Link>
    </div>
  );
}

function MobileGroup({ title, href, children }: { title: string; href: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-2 flex items-baseline justify-between border-b border-ink pb-2">
        <h2 className="display text-2xl">{title.toUpperCase()}</h2>
        <Link href={href} className="text-xs font-semibold underline">
          See all
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-x-4">{children}</div>
    </section>
  );
}

export function InstagramIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}
