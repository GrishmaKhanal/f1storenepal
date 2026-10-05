import type { Metadata } from "next";
import { InstagramCta, PageHead, Paras, wrap } from "@/components/chrome";
import { getSettings } from "@/lib/data";

export const metadata: Metadata = { title: "Returns", description: "Damaged or wrong item? Here's how returns work.", alternates: { canonical: "/returns" } };

export default async function Page() {
  const s = await getSettings();
  return (
    <>
      <PageHead crumbs={[["Returns", "/returns"]]} title="Returns" />
      <section className={`${wrap} grid max-w-[1320px] gap-10 pb-[72px] lg:grid-cols-[minmax(0,1fr)_380px]`}>
        <Paras text={s.returnsInfo} className="max-w-[640px] text-[16.5px] leading-relaxed text-[#33302c]" />
        <div className="flex flex-col gap-4">
          <InstagramCta url={s.instagramUrl} handle={s.instagramHandle} text="Still have a question?" />
        </div>
      </section>
    </>
  );
}
