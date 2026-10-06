import type { Metadata } from "next";
import { Collection } from "@/components/Collection";
import { getNewest } from "@/lib/data";

export const metadata: Metadata = {
  title: "New in: latest F1 diecast and merch",
  description: "The newest F1 diecast cars, caps and Formula 1 gifts, just landed in Nepal. Delivered anywhere in the country.",
  alternates: { canonical: "/new" },
};

export default async function NewIn() {
  return <Collection crumbs={[["New in", "/new"]]} title="New in" intro="Fresh off the transporter." url="/new" products={await getNewest(48)} />;
}
