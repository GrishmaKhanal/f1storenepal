import type { Metadata } from "next";
import { InstagramCta, PageHead, wrap } from "@/components/chrome";
import { getSettings } from "@/lib/data";
import { TrackForm } from "./form";

export const metadata: Metadata = { title: "Track your order", description: "See where your order is: enter your order number and phone number.", alternates: { canonical: "/track" } };

export default async function Track({ searchParams }: PageProps<"/track">) {
  const [s, q] = await Promise.all([getSettings(), searchParams]);
  const order = typeof q.order === "string" ? q.order.slice(0, 20) : "";
  return (
    <>
      <PageHead crumbs={[["Track order", "/track"]]} title="Track your order" intro="Enter your order number and the phone number you ordered with." />
      <section className={`${wrap} grid gap-8 pb-[72px] lg:grid-cols-[minmax(0,560px)_380px] lg:justify-between`}>
        <TrackForm order={order} />
        <div className="flex flex-col gap-4 self-start">
          <InstagramCta url={s.instagramUrl} handle={s.instagramHandle} text="Can't find your order number?" />
        </div>
      </section>
    </>
  );
}
