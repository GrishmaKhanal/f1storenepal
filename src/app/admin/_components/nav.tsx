"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { logout } from "../actions";
import { Popconfirm } from "./popconfirm";

const items = [
  ["Dashboard", ""],
  ["Orders", "/orders"],
  ["Products", "/products"],
  ["Teams", "/teams"],
  ["Drivers", "/drivers"],
  ["Categories", "/categories"],
  ["Media", "/media"],
  ["Site content", "/settings"],
] as const;

// `base` comes from the server layout so the secret path isn't baked into client JS.
export function AdminNav({ newOrders, base }: { newOrders: number; base: string }) {
  const pathname = usePathname();
  const ref = useRef<HTMLElement>(null);
  const rel = pathname.startsWith(base) ? pathname.slice(base.length) : pathname.replace(/^\/admin/, "");

  useEffect(() => {
    ref.current?.querySelector('[aria-current="page"]')?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [rel]);

  return (
    <nav ref={ref} aria-label="Admin" className="no-scrollbar order-last flex w-full overflow-x-auto border-t border-rule xl:order-none xl:w-auto xl:flex-1 xl:border-t-0">
      {items.map(([label, href]) => {
        const on = href ? rel.startsWith(href) : rel === "";
        return (
          <Link
            key={href}
            href={`${base}${href}`}
            aria-current={on ? "page" : undefined}
            className={`flex min-h-[52px] shrink-0 items-center border-b-2 px-4 text-sm font-semibold whitespace-nowrap xl:min-h-[64px] ${on ? "border-red text-ink" : "border-transparent text-ink-4 hover:text-ink"}`}
          >
            {label}
            {label === "Orders" && newOrders > 0 && <span className="ml-1.5 rounded-full bg-red px-1.5 font-mono text-[11px] text-white">{newOrders}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

export function LogoutButton() {
  return (
    <form action={logout} className="flex">
      <Popconfirm
        label="Log out"
        title="Log out?"
        description="Unsaved changes on this page will be lost."
        confirmLabel="Log out"
        danger={false}
        className="flex items-stretch"
        triggerClassName="px-4 text-sm font-medium hover:text-red"
      />
    </form>
  );
}
