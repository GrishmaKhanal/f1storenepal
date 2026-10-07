import type { Metadata } from "next";
import Link from "next/link";
import { PageHead, wrap } from "@/components/chrome";
import { Img } from "@/components/Img";
import { getCatalog } from "@/lib/data";
import { paths } from "@/lib/site";

export const metadata: Metadata = {
  title: "Shop by F1 team",
  description: "Diecast cars, caps and gifts for every Formula 1 team: Ferrari, McLaren, Red Bull, Mercedes and more. Delivered across Nepal.",
  alternates: { canonical: "/teams" },
};

export default async function Teams() {
  const { teams } = await getCatalog();
  return (
    <>
      <PageHead crumbs={[["Teams", "/teams"]]} title="Shop by team" intro="Pick your colours. Every constructor on the grid." />
      <section className={`${wrap} grid grid-cols-1 gap-3 pb-[72px] sm:grid-cols-2 lg:grid-cols-3`}>
        {teams.map((t) => (
          <Link key={t.slug} href={paths.team(t.slug)} className="group overflow-hidden rounded-[14px] border border-rule bg-white transition-all duration-200 ease-out-soft hover:-translate-y-[3px] hover:border-ink hover:text-ink">
            <span className="relative flex aspect-[4/1] items-center justify-center overflow-hidden px-3">
              {t.logo ? <Img img={t.logo} sizes="(max-width: 640px) calc(100vw - 32px), (max-width: 1024px) 50vw, 33vw" alt={`${t.name} 2026 Formula 1 car`} className="h-full w-full object-contain transition-transform duration-300 ease-out-soft group-hover:scale-105" /> : <span className="h-1.5 w-11 rounded-[3px]" style={{ background: t.color ?? "#111" }} />}
            </span>
            <span className="flex items-center justify-between gap-4 border-t border-rule p-5">
              <span className="flex items-center gap-4">
                <span className="h-12 w-2 rounded" style={{ background: t.color ?? "#111" }} />
                <span>
                  <span className="block font-display text-[30px] leading-none font-bold">{t.name}</span>
                  <span className="text-sm text-faint">
                    {t.count} product{t.count === 1 ? "" : "s"}
                  </span>
                </span>
              </span>
              <span aria-hidden className="text-xl transition-transform group-hover:translate-x-1">→</span>
            </span>
          </Link>
        ))}
      </section>
    </>
  );
}
