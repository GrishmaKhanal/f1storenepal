import type { Metadata } from "next";
import Link from "next/link";
import { PageHead, wrap } from "@/components/chrome";
import { getCatalog } from "@/lib/data";
import { paths } from "@/lib/site";

export const metadata: Metadata = {
  title: "F1 accessories and gifts",
  description: "Formula 1 caps, keychains, display cases, posters, mugs and gift sets, delivered across Nepal.",
  alternates: { canonical: "/accessories" },
};

export default async function Accessories() {
  const { categories } = await getCatalog();
  const acc = categories.filter((c) => c.isAccessory);
  return (
    <>
      <PageHead crumbs={[["Accessories", "/accessories"]]} title="Accessories" intro="Gifts and garage pieces." />
      <section className={`${wrap} grid grid-cols-2 gap-3 pb-[72px] sm:grid-cols-3`}>
        {acc.map((a) => (
          <Link key={a.slug} href={paths.category(a.slug)} className="flex aspect-[1.4] flex-col justify-between rounded-[14px] bg-ink p-6 text-paper transition-colors duration-200 hover:bg-red hover:text-white">
            <span className="font-mono text-[11px] opacity-70">
              {a.count} item{a.count === 1 ? "" : "s"}
            </span>
            <span className="font-display text-[clamp(26px,3vw,36px)] leading-none font-bold">{a.name}</span>
          </Link>
        ))}
      </section>
    </>
  );
}
