import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { connection } from "next/server";
import { db, hasDb } from "@/db";
import { orderItems, orders } from "@/db/schema";
import { InstagramCta, wrap } from "@/components/chrome";
import { getSettings } from "@/lib/data";
import { orderNo, rs } from "@/lib/money";

export const metadata: Metadata = { title: "Order received", robots: { index: false, follow: false } };

// Reached only through the unguessable token. Shows items and totals, never the
// customer's address or phone, so a forwarded link leaks nothing personal.
export default async function OrderPage({ params }: PageProps<"/order/[token]">) {
  await connection();
  const { token } = await params;
  if (!hasDb || !/^[A-Za-z0-9_-]{10,40}$/.test(token)) notFound();
  const [o] = await db.select().from(orders).where(eq(orders.token, token)).limit(1);
  if (!o) notFound();
  const [items, s] = await Promise.all([db.select().from(orderItems).where(eq(orderItems.orderId, o.id)), getSettings()]);
  const pay = s.paymentMethods.find((p) => p.key === o.paymentMethod);

  return (
    <section className={`${wrap} max-w-[760px] py-14`}>
      <div className="rise rounded-[20px] border border-rule bg-white p-7 sm:p-10">
        <div className="font-mono text-xs tracking-[.12em] text-red">ORDER {orderNo(o.id)}</div>
        <h1 className="display mt-3 text-[clamp(44px,7vw,72px)] italic">THANK YOU, {o.customerName.split(" ")[0].toUpperCase()}.</h1>
        <p className="mt-4 text-[16px] leading-relaxed text-muted">
          We&apos;ve got your order. We&apos;ll call or message you shortly to confirm it before it ships.
          {o.status === "cancelled" && " This order has been cancelled."}
        </p>
        {pay?.instructions && (
          <p className="mt-4 rounded-[10px] bg-paper p-4 text-sm">
            <span className="font-semibold">{pay.label}:</span> {pay.instructions}
          </p>
        )}
        <ul className="mt-8 divide-y divide-rule border-y border-rule">
          {items.map((i) => (
            <li key={i.id} className="flex justify-between gap-4 py-3 text-sm">
              <span>
                {i.productName}
                {i.variantLabel && <span className="text-faint"> · {i.variantLabel}</span>} <span className="text-faint">× {i.quantity}</span>
              </span>
              <span className="tabular-nums">{rs(i.unitPrice * i.quantity)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-4 flex flex-col gap-1 text-sm">
          <div className="flex justify-between"><dt>Subtotal</dt><dd className="tabular-nums">{rs(o.subtotal)}</dd></div>
          <div className="flex justify-between"><dt>Delivery{o.deliveryZone && ` (${o.deliveryZone})`}</dt><dd className="tabular-nums">{o.deliveryFee ? rs(o.deliveryFee) : "Free"}</dd></div>
          <div className="mt-2 flex justify-between text-lg font-semibold"><dt>Total</dt><dd className="tabular-nums">{rs(o.total)}</dd></div>
        </dl>
        <p className="mt-6 text-xs text-faint">Keep this page&apos;s link to check your order. Quote {orderNo(o.id)} if you message us.</p>
      </div>
      <div className="mt-6 flex flex-col gap-4">
        <InstagramCta url={s.instagramUrl} handle={s.instagramHandle} text="Questions about your order?" />
        <Link href="/shop" className="text-center text-sm font-semibold underline">Keep shopping</Link>
      </div>
    </section>
  );
}
