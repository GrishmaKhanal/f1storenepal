"use client";

import type { SiteSettings } from "@/db/schema";
import { saveSettings } from "../actions";
import { Area, Counted, ImageField, Section, Select, Text, type MediaLite } from "../_components/fields";
import { SaveForm } from "../_components/save";

const pipeHint = (eg: string) => <>One per line, parts separated by <code>|</code>. e.g. <code>{eg}</code>. Empty = hidden.</>;

export function SettingsForm({ s, heroImage, library, products }: { s: SiteSettings; heroImage: MediaLite | null; library: MediaLite[]; products: [number, string][] }) {
  return (
    <SaveForm action={saveSettings} className="space-y-5">
      <Section title="Store">
        <div className="grid gap-4 sm:grid-cols-2">
          <Text name="storeName" label="Store name" defaultValue={s.storeName} required />
          <Text name="tagline" label="Tagline" defaultValue={s.tagline} placeholder="F1 merch & diecast, delivered across Nepal" />
          <Text name="location" label="Location" defaultValue={s.location} placeholder="Jhapa, Nepal" hint="“Town, Country”. Your address, shown in the footer and used for local search (structured data). Where you deliver goes under Delivery." />
          <Text name="streetAddress" label="Street address" defaultValue={s.streetAddress} hint="Optional." />
          <Text name="phone" label="Phone" defaultValue={s.phone} hint="Optional. Shown publicly." />
          <Text name="whatsapp" label="WhatsApp" defaultValue={s.whatsapp} hint="Optional. Shown on Contact." />
          <Text name="email" label="Email" type="email" defaultValue={s.email} hint="Optional. Shown publicly." />
          <Text name="lowStockThreshold" label="Low stock warning at" defaultValue={s.lowStockThreshold} hint="“Only N left” and dashboard alerts at or below this." />
        </div>
      </Section>

      <Section title="Instagram">
        <div className="grid gap-4 sm:grid-cols-2">
          <Text name="instagramUrl" label="Instagram link" defaultValue={s.instagramUrl} placeholder="https://www.instagram.com/lightsoutnepal/" hint="Empty hides every Instagram link and button." />
          <Text name="instagramHandle" label="Handle" defaultValue={s.instagramHandle} placeholder="@lightsoutnepal" />
        </div>
      </Section>

      <Section title="Announcement strip">
        <Area name="announcements" label="Messages" rows={3} defaultValue={s.announcements.join("\n")} hint="One per line, shown in the black strip above the header. Empty = no strip." />
      </Section>

      <Section title="Home page hero">
        <div className="grid gap-4 sm:grid-cols-2">
          <Select name="heroStyle" label="Style" empty={null} defaultValue={s.heroStyle} options={[["dark", "Dark"], ["light", "Light"]]} />
          <Text name="heroEyebrow" label="Small line above" defaultValue={s.heroEyebrow} placeholder="New arrival · 1:43 scale" />
        </div>
        <Area name="heroTitle" label="Headline" rows={3} defaultValue={s.heroTitle} hint={<>One line per row. Wrap words in <code>*stars*</code> to make them red. Empty = no hero.</>} />
        <Area name="heroBody" label="Text" rows={2} defaultValue={s.heroBody} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Select name="heroProductId" label="Product for the “Add to bag” button" defaultValue={s.heroProductId} options={products} empty="No button" />
          <Text name="heroWatermark" label="Big background number" defaultValue={s.heroWatermark} placeholder="44" hint="Dark style only." />
          <Text name="heroSecondaryLabel" label="Second button label" defaultValue={s.heroSecondaryLabel} placeholder="All Ferrari" />
          <Text name="heroSecondaryHref" label="Second button link" defaultValue={s.heroSecondaryHref} placeholder="/teams/ferrari" />
        </div>
        <ImageField name="heroImageId" label="Hero image" hint="Empty = the hero product's main photo. Transparent or white-background photos look best." initial={heroImage} library={library} folder="products" />
      </Section>

      <Section title="How ordering works">
        <Area name="steps" label="Steps" rows={4} mono defaultValue={s.steps.map((x) => `${x.title} | ${x.body}`).join("\n")} hint={pipeHint("Pay your way | eSewa, Khalti or cash on delivery.")} />
      </Section>

      <Section title="Delivery & payment">
        <Area name="deliveryZones" label="Delivery areas and fees (Rs)" rows={5} mono defaultValue={s.deliveryZones.map((z) => `${z.name} | ${z.fee}`).join("\n")} hint={pipeHint("Jhapa | 100")} />
        <Area name="serviceAreas" label="Towns you deliver to" rows={4} defaultValue={s.serviceAreas.join("\n")} hint="One per line. Listed on the home page and given to search engines as the area you serve. Empty = hidden." />
        <Text name="freeDeliveryOver" label="Free delivery over (Rs)" defaultValue={s.freeDeliveryOver} hint="Optional." />
        <Area name="paymentMethods" label="Payment methods" rows={5} mono defaultValue={s.paymentMethods.map((p) => `${p.label} | ${p.instructions ?? ""}`).join("\n")} hint={pipeHint("eSewa | We'll message you with payment details.")} />
        <p className="text-xs text-ink-5">Payment instructions are public (shown at checkout). Don&apos;t paste account numbers you wouldn&apos;t want on the site; send them to customers directly.</p>
      </Section>

      <Section title="Pages">
        <Area name="deliveryInfo" label="Delivery page" rows={5} defaultValue={s.deliveryInfo} hint="Blank line = new paragraph." />
        <Area name="returnsInfo" label="Returns page" rows={4} defaultValue={s.returnsInfo} />
        <Area name="contactInfo" label="Contact page intro" rows={3} defaultValue={s.contactInfo} />
        <Area name="footerAbout" label="Footer description" rows={2} defaultValue={s.footerAbout} hint="A line or two under the logo in the footer. Empty = hidden." />
        <Text name="footerDisclaimer" label="Footer note" defaultValue={s.footerDisclaimer} hint="Optional extra line in the footer fine print. The &ldquo;not affiliated with Formula 1&rdquo; notice is always shown, so don&apos;t repeat it here." />
      </Section>

      <Section title="Search engines (site-wide)">
        <Counted name="seoTitle" label="Home page title" max={60} defaultValue={s.seoTitle} />
        <Counted name="seoDescription" label="Default description" max={160} rows={3} defaultValue={s.seoDescription} hint="Used on the home page and anywhere without its own description." />
        <Area name="seoKeywords" label="Search phrases" rows={6} defaultValue={s.seoKeywords.join("\n")} hint="One per line, e.g. “F1 store Kathmandu”. Added to every page as meta keywords. Google ignores that tag, so also use these words in titles, descriptions and product text." />
      </Section>
    </SaveForm>
  );
}
