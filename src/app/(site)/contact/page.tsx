import type { Metadata } from "next";
import { InstagramCta, PageHead, Paras, wrap } from "@/components/chrome";
import { getSettings } from "@/lib/data";

export const metadata: Metadata = { title: "Contact", description: "Get in touch with F1 Store Nepal in Jhapa: Instagram, phone and email.", alternates: { canonical: "/contact" } };

export default async function Contact() {
  const s = await getSettings();
  const rows = [
    ["Location", s.streetAddress ? `${s.streetAddress}, ${s.location ?? ""}` : s.location],
    ["Phone", s.phone && <a href={`tel:${s.phone.replace(/\s/g, "")}`} className="underline">{s.phone}</a>],
    ["WhatsApp", s.whatsapp && <a href={`https://wa.me/${s.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener" className="underline">{s.whatsapp}</a>],
    ["Email", s.email && <a href={`mailto:${s.email}`} className="underline">{s.email}</a>],
    ["Instagram", s.instagramUrl && <a href={s.instagramUrl} target="_blank" rel="noopener" className="underline">{s.instagramHandle ?? s.instagramUrl}</a>],
  ].filter(([, v]) => v) as [string, React.ReactNode][];
  return (
    <>
      <PageHead crumbs={[["Contact", "/contact"]]} title="Contact" />
      <section className={`${wrap} grid gap-10 pb-[72px] lg:grid-cols-[minmax(0,1fr)_380px]`}>
        <div className="flex flex-col gap-8">
          <Paras text={s.contactInfo} className="max-w-[640px] text-[16.5px] leading-relaxed text-[#33302c]" />
          <dl className="grid max-w-[560px] grid-cols-[120px_1fr] gap-y-3 border-t border-rule pt-6 text-[15px]">
            {rows.map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="text-faint">{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </div>
        <InstagramCta url={s.instagramUrl} handle={s.instagramHandle} text="DM us to order or ask anything" />
      </section>
    </>
  );
}
