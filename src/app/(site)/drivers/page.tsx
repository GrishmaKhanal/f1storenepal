import type { Metadata } from "next";
import Link from "next/link";
import { PageHead, wrap } from "@/components/chrome";
import { Img } from "@/components/Img";
import { getCatalog } from "@/lib/data";
import { paths } from "@/lib/site";

export const metadata: Metadata = {
  title: "Shop by F1 driver",
  description: "Diecast cars, caps and gifts for every driver on the Formula 1 grid: Hamilton, Verstappen, Norris, Leclerc and more. Delivered across Nepal.",
  alternates: { canonical: "/drivers" },
};

export default async function Drivers() {
  const { drivers } = await getCatalog();
  return (
    <>
      <PageHead crumbs={[["Drivers", "/drivers"]]} title="Shop by driver" intro="Every car, cap and keyring for the grid." />
      <section className={`${wrap} grid grid-cols-2 gap-3 pb-[72px] sm:grid-cols-3 lg:grid-cols-4`}>
        {drivers.map((d) => (
          <Link key={d.slug} href={paths.driver(d.slug)} className="group flex flex-col overflow-hidden rounded-[14px] border border-rule bg-white transition-all duration-200 ease-out-soft hover:-translate-y-[3px] hover:border-ink hover:text-ink">
            <span className="stripes relative flex aspect-[4/5] items-end overflow-hidden p-3.5">
              {d.portrait && <Img img={d.portrait} sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" alt={`${d.name}, ${d.team?.name ?? "Formula 1"} driver`} className="absolute inset-0 h-full w-full object-cover object-top origin-top transition-transform duration-500 ease-out-soft group-hover:scale-105" />}
              <span className="display absolute top-2.5 right-3.5 text-[56px] italic" style={{ color: d.team?.color ?? "#111" }}>
                {d.number}
              </span>
            </span>
            <span className="flex flex-col gap-[3px] px-4 pt-3.5 pb-4">
              <span className="block font-display text-[24px] leading-none font-bold">{d.name}</span>
              <span className="text-[12.5px] text-faint">
                {d.team?.name}
                {d.count > 0 && ` · ${d.count}`}
              </span>
            </span>
          </Link>
        ))}
      </section>
    </>
  );
}
