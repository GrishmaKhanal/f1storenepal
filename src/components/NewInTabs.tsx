"use client";

import { useState } from "react";

// The grid is rendered on the server; tabs only choose which cards are visible, so
// every product link is in the HTML crawlers see.
export function NewInTabs({ tabs, items }: { tabs: { key: string; label: string }[]; items: { id: number; cats: string[]; node: React.ReactNode }[] }) {
  const [tab, setTab] = useState("all");
  const all = [{ key: "all", label: "All" }, ...tabs];
  const visible = items.filter((i) => tab === "all" || i.cats.includes(tab)).slice(0, 8);
  return (
    <>
      <div className="-mt-2 mb-6 flex flex-wrap gap-1.5" role="tablist" aria-label="Filter new arrivals">
        {all.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={t.key === tab}
            onClick={() => setTab(t.key)}
            className={`cursor-pointer rounded-full border px-4 py-[9px] text-[13.5px] font-semibold transition-colors ${t.key === tab ? "border-ink bg-ink text-white" : "border-[#d9d6d0] hover:border-ink"}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-4 md:grid-cols-[repeat(auto-fill,minmax(250px,1fr))]">
        {visible.map((i) => (
          <div key={i.id} className="rise">
            {i.node}
          </div>
        ))}
      </div>
      {!visible.length && <p className="rounded-[14px] border border-dashed border-rule p-10 text-center text-muted">Nothing new here yet.</p>}
    </>
  );
}
