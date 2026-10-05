import type { Metadata } from "next";
import Link from "next/link";
import { count, eq } from "drizzle-orm";
import { db, hasDb } from "@/db";
import { orders } from "@/db/schema";
import { isAdmin } from "@/lib/auth";
import { ADMIN } from "@/lib/admin-path";
import { AdminNav, LogoutButton } from "./_components/nav";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const authed = await isAdmin();
  const newOrders = authed && hasDb ? (await db.select({ n: count() }).from(orders).where(eq(orders.status, "new")))[0].n : 0;

  return (
    <div className="min-h-screen bg-paper text-ink">
      {authed && (
        <header className="sticky top-0 z-20 border-b border-rule bg-white">
          <div className="flex flex-wrap items-stretch xl:flex-nowrap">
            <Link href={ADMIN} className="flex items-center gap-2.5 px-4 py-2 hover:text-ink xl:pr-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/logo.jpeg" alt="" className="h-9 w-9 rounded-full" />
              <span className="display text-lg leading-none">
                ADMIN
                <span className="block font-sans text-[11px] font-normal text-ink-5">F1 Store Nepal</span>
              </span>
            </Link>
            <AdminNav newOrders={newOrders} base={ADMIN} />
            <div className="ml-auto flex items-stretch text-sm font-medium">
              <Link href="/" target="_blank" className="flex items-center px-4 hover:text-red">View site ↗</Link>
              <LogoutButton />
            </div>
          </div>
        </header>
      )}
      <main className="mx-auto max-w-6xl px-[clamp(16px,4vw,40px)] py-6 sm:py-10">{children}</main>
    </div>
  );
}
