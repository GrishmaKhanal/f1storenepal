"use client";

import type { Category, Driver, Team } from "@/db/schema";
import { deleteCategory, deleteDriver, deleteTeam, saveCategory, saveDriver, saveTeam } from "../actions";
import { Area, Check, Counted, Field, ImageField, input, NameSlug, Section, Select, Text, type MediaLite } from "./fields";
import { Popconfirm } from "./popconfirm";
import { SaveForm } from "./save";
import { useState } from "react";

function Seo({ v }: { v: { seoTitle: string | null; seoDescription: string | null } | null }) {
  return (
    <Section title="Search engines">
      <Counted name="seoTitle" label="SEO title" max={60} defaultValue={v?.seoTitle} hint="Optional. A good default is generated from the name." />
      <Counted name="seoDescription" label="SEO description" max={160} rows={2} defaultValue={v?.seoDescription} />
    </Section>
  );
}

function Delete({ action, id, what }: { action: (fd: FormData) => Promise<void>; id: number; what: string }) {
  return (
    <form action={action} className="mt-6">
      <input type="hidden" name="id" value={id} />
      <Popconfirm label={`Delete ${what}`} title={`Delete this ${what}?`} description={`Products linked to it stay, just without a ${what}. Unticking “Show on site” hides it instead.`} confirmLabel="Delete" align="start" triggerClassName="text-sm text-red underline" />
    </form>
  );
}

function Visibility({ published, sortOrder, children }: { published: boolean; sortOrder: number; children?: React.ReactNode }) {
  return (
    <Section title="Visibility">
      <Check name="published" label="Show on site" defaultChecked={published} />
      {children}
      <Text name="sortOrder" label="Sort order" defaultValue={sortOrder} hint="Lower shows first." />
    </Section>
  );
}

export function TeamForm({ team, logo, library, created }: { team: Team | null; logo: MediaLite | null; library: MediaLite[]; created: boolean }) {
  const [color, setColor] = useState(team?.color ?? "#111111");
  return (
    <>
      <SaveForm action={saveTeam} created={created} className="space-y-5">
        <input type="hidden" name="id" value={team?.id ?? ""} />
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-5">
            <Section title="Team">
              <NameSlug name={team?.name ?? ""} slug={team?.slug ?? ""} base="/teams" isNew={!team} />
              <Field label="Team colour" hint="Used for the stripe on team tiles and product dots.">
                <span className="flex items-center gap-2">
                  <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-9 w-12 cursor-pointer rounded border border-rule" aria-label="Pick colour" />
                  <input name="color" value={color} onChange={(e) => setColor(e.target.value)} className={`${input} font-mono`} />
                </span>
              </Field>
              <Area name="description" label="Intro" rows={3} defaultValue={team?.description} hint="Shown at the top of the team page. Good for search: mention what you stock." />
              <ImageField name="logoId" label="Logo (optional)" initial={logo} library={library} />
            </Section>
            <Seo v={team} />
          </div>
          <Visibility published={team?.published ?? true} sortOrder={team?.sortOrder ?? 0} />
        </div>
      </SaveForm>
      {team && <Delete action={deleteTeam} id={team.id} what="team" />}
    </>
  );
}

export function DriverForm({ driver, portrait, library, teams, created }: { driver: Driver | null; portrait: MediaLite | null; library: MediaLite[]; teams: [number, string][]; created: boolean }) {
  return (
    <>
      <SaveForm action={saveDriver} created={created} className="space-y-5">
        <input type="hidden" name="id" value={driver?.id ?? ""} />
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-5">
            <Section title="Driver">
              <NameSlug name={driver?.name ?? ""} slug={driver?.slug ?? ""} base="/drivers" isNew={!driver} />
              <div className="grid gap-4 sm:grid-cols-2">
                <Text name="number" label="Car number" defaultValue={driver?.number} />
                <Select name="teamId" label="Team" defaultValue={driver?.teamId} options={teams} />
              </div>
              <Area name="description" label="Intro" rows={3} defaultValue={driver?.description} />
              <ImageField name="portraitId" label="Portrait (optional)" hint="Shown on the home page driver cards. Use a photo you have the rights to." initial={portrait} library={library} />
            </Section>
            <Seo v={driver} />
          </div>
          <Visibility published={driver?.published ?? true} sortOrder={driver?.sortOrder ?? 0}>
            <Check name="featured" label="Feature on the home page" defaultChecked={driver?.featured ?? false} />
          </Visibility>
        </div>
      </SaveForm>
      {driver && <Delete action={deleteDriver} id={driver.id} what="driver" />}
    </>
  );
}

export function CategoryForm({ category, created }: { category: Category | null; created: boolean }) {
  return (
    <>
      <SaveForm action={saveCategory} created={created} className="space-y-5">
        <input type="hidden" name="id" value={category?.id ?? ""} />
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-5">
            <Section title="Category">
              <NameSlug name={category?.name ?? ""} slug={category?.slug ?? ""} base="/accessories" isNew={!category} />
              <Area name="description" label="Intro" rows={3} defaultValue={category?.description} />
            </Section>
            <Seo v={category} />
          </div>
          <Visibility published={category?.published ?? true} sortOrder={category?.sortOrder ?? 0}>
            <Check name="isAccessory" label="List under Accessories" hint="In the Accessories menu, page and home tiles." defaultChecked={category?.isAccessory ?? false} />
            <Check name="showAsTab" label="Tab on “New in”" hint="A filter tab on the home page." defaultChecked={category?.showAsTab ?? false} />
          </Visibility>
        </div>
      </SaveForm>
      {category && <Delete action={deleteCategory} id={category.id} what="category" />}
    </>
  );
}
