import type { Metadata } from "next";
import { InstagramCta, PageHead, Paras, wrap } from "@/components/chrome";
import { getSettings } from "@/lib/data";
import { rs } from "@/lib/money";

export const metadata: Metadata = { title: "Delivery", description: "How delivery works across Nepal: areas, fees and timing.", alternates: { canonical: "/delivery" } };

export default async function Page() {
  const s = await getSettings();
  return (
    <>
      <PageHead crumbs={[["Delivery", "/delivery"]]} title="Delivery" />
      <section className={`${wrap} grid max-w-[1320px] gap-10 pb-[72px] lg:grid-cols-[minmax(0,1fr)_380px]`}>
        <Paras text={s.deliveryInfo} className="max-w-[640px] text-[16.5px] leading-relaxed text-[#33302c]" />
        <div className="flex flex-col gap-4">
          {s.deliveryZones.length > 0 && (
            <div className="rounded-[14px] border border-rule bg-white p-5">
              <h2 className="display mb-3 text-2xl">DELIVERY FEES</h2>
              <ul className="divide-y divide-rule text-sm">
                {s.deliveryZones.map((z) => (
                  <li key={z.name} className="flex justify-between py-2"><span>{z.name}</span><span className="tabular-nums">{z.fee ? rs(z.fee) : "Free"}</span></li>
                ))}
              </ul>
              {s.freeDeliveryOver != null && <p className="mt-3 text-xs text-faint">Free delivery on orders over {rs(s.freeDeliveryOver)}.</p>}
            </div>
          )}
          <InstagramCta url={s.instagramUrl} handle={s.instagramHandle} text="Still have a question?" />
        </div>
      </section>
    </>
  );
}
