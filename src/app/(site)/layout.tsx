import { BagProvider } from "@/components/bag";
import { Footer, Strip } from "@/components/chrome";
import { MegaNav } from "@/components/MegaNav";
import { getCatalog, getSettings } from "@/lib/data";

export default async function SiteLayout({ children }: LayoutProps<"/">) {
  const [s, c] = await Promise.all([getSettings(), getCatalog()]);
  return (
    <BagProvider>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2">
        Skip to content
      </a>
      <Strip items={s.announcements} />
      <MegaNav
        data={{
          storeName: s.storeName,
          logo: "/assets/logo.png",
          instagramUrl: s.instagramUrl,
          drivers: c.drivers.map((d) => ({ slug: d.slug, name: d.name, number: d.number })),
          teams: c.teams.map((t) => ({ slug: t.slug, name: t.name, color: t.color })),
          accessories: c.categories.filter((x) => x.isAccessory && x.count > 0).map((x) => ({ slug: x.slug, name: x.name, count: x.count })),
        }}
      />
      <main id="main" className="min-h-[60vh]">{children}</main>
      <Footer s={s} />
    </BagProvider>
  );
}
