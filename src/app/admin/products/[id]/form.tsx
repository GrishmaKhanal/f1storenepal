"use client";

import Link from "next/link";
import type { Product } from "@/db/schema";
import { deleteProduct, saveProduct } from "../../actions";
import { Area, Check, Counted, ImagesField, NameSlug, Section, Select, Text, VariantsEditor, type MediaLite, type VariantRow } from "../../_components/fields";
import { Popconfirm } from "../../_components/popconfirm";
import { SaveForm } from "../../_components/save";

type Opt = [number, string][];

export function ProductForm({ product, variants, images, library, teams, drivers, categories, created }: { product: Product | null; variants: VariantRow[]; images: MediaLite[]; library: MediaLite[]; teams: Opt; drivers: Opt; categories: Opt; created: boolean }) {
  const p = product;
  return (
    <>
      <SaveForm
        action={saveProduct}
        created={created}
        className="space-y-5"
        extra={
          p && (
            <>
              {p.status === "active" && (
                <Link href={`/products/${p.slug}`} target="_blank" className="underline">
                  View on site ↗
                </Link>
              )}
            </>
          )
        }
      >
        <input type="hidden" name="id" value={p?.id ?? ""} />
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-5">
            <Section title="Details">
              <NameSlug name={p?.name ?? ""} slug={p?.slug ?? ""} base="/products" isNew={!p} />
              <Area name="description" label="Description" rows={5} defaultValue={p?.description} hint="Shown on the product page and used by search engines. Blank line = new paragraph." />
              <div className="grid gap-4 sm:grid-cols-3">
                <Text name="brand" label="Brand" defaultValue={p?.brand} placeholder="Bburago" />
                <Text name="scale" label="Scale / size" defaultValue={p?.scale} placeholder="1:43" />
                <Text name="badge" label="Badge" defaultValue={p?.badge} placeholder="New, Bestseller, Pre-order" />
              </div>
            </Section>
            <Section title="Images">
              <ImagesField initial={images} library={library} />
            </Section>
            <Section title="Price & stock">
              <div className="grid gap-4 sm:grid-cols-2">
                <Text name="price" label="Price (Rs)" defaultValue={p?.price} placeholder="4299" hint="Variants can override it." />
                <Text name="compareAtPrice" label="Compare-at price (Rs)" defaultValue={p?.compareAtPrice} hint="Optional. Shown struck through when higher than the price." />
              </div>
              <Check name="allowNoPrice" label="No price: show “Ask on Instagram”" hint="Lets an active product have no price. It can't be added to the bag." defaultChecked={p?.price == null && !!p} />
              <VariantsEditor initial={variants} />
            </Section>
            <Section title="Search engines">
              <Counted name="seoTitle" label="SEO title" max={60} defaultValue={p?.seoTitle} hint="Optional. Defaults to the product name." />
              <Counted name="seoDescription" label="SEO description" max={160} rows={2} defaultValue={p?.seoDescription} hint="Optional. Defaults to the description plus price." />
            </Section>
          </div>
          <div className="space-y-5">
            <Section title="Visibility">
              <Select name="status" label="Status" hint="Draft and Archived are hidden. Active is public; set every variant's stock to 0 to mark an active product sold out." empty={null} defaultValue={p?.status ?? "draft"} options={[["draft", "Draft (hidden)"], ["active", "Active (on the site)"], ["archived", "Archived (hidden)"]]} />
              <Text name="sortOrder" label="Sort order" defaultValue={p?.sortOrder ?? 0} hint="Lower shows first in “Featured”." />
            </Section>
            <Section title="Organise">
              <Select name="teamId" label="Team" defaultValue={p?.teamId} options={teams} />
              <Select name="driverId" label="Driver" defaultValue={p?.driverId} options={drivers} />
              <Select name="categoryId" label="Category" defaultValue={p?.categoryId} options={categories} />
            </Section>
          </div>
        </div>
      </SaveForm>
      {p && (
        <form action={deleteProduct} className="mt-6">
          <input type="hidden" name="id" value={p.id} />
          <Popconfirm
            label="Delete product"
            title="Delete this product?"
            description="It disappears from the site. Past orders keep their copy of the name and price. Archiving hides it without deleting."
            confirmLabel="Delete"
            align="start"
            triggerClassName="text-sm text-red underline"
          />
        </form>
      )}
    </>
  );
}
