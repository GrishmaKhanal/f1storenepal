import type { Metadata } from "next";
import { PageHead, wrap } from "@/components/chrome";
import { getSettings } from "@/lib/data";
import { instagramDmLink } from "@/lib/instagram";
import { CheckoutForm } from "./form";

export const metadata: Metadata = { title: "Checkout", robots: { index: false, follow: false } };

export default async function Checkout() {
  const s = await getSettings();
  const dmUrl = instagramDmLink(s.instagramHandle, s.instagramUrl);
  return (
    <>
      <PageHead crumbs={[["Checkout", "/checkout"]]} title="Checkout" intro="No account needed. We'll call or message you to confirm before anything ships." />
      <section className={`${wrap} pb-[72px]`}>
        <CheckoutForm zones={s.deliveryZones} freeOver={s.freeDeliveryOver} payments={s.paymentMethods} instagramDmUrl={dmUrl} />
      </section>
    </>
  );
}
