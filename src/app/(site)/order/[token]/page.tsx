import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { connection } from "next/server";
import { db, hasDb } from "@/db";
import { orderItems, orders, type OrderStatus } from "@/db/schema";
import { InstagramCta } from "@/components/chrome";
import { CheckBadge, Lights, Rise, Stagger } from "@/components/motion";
import { getSettings } from "@/lib/data";
import { orderNo, rs } from "@/lib/money";

export const metadata: Metadata = { title: "Order received", robots: { index: false, follow: false } };

const STEPS = ["Received", "Confirmed", "Shipped", "Delivered"] as const;

// The link is kept for checking the order later, so the big line follows the status.
const STATUS: Record<OrderStatus, { title: string; line: string; at: number }> = {
  new: { title: "Order received.", line: "We'll contact you soon to confirm.", at: 0 },
  confirmed: { title: "Order confirmed.", line: "We're getting it ready to ship.", at: 1 },
  paid: { title: "Order confirmed.", line: "Payment received. We're getting it ready to ship.", at: 1 },
  shipped: { title: "On its way.", line: "Your order has shipped.", at: 2 },
  delivered: { title: "Delivered.", line: "Enjoy it, and thanks for shopping with us.", at: 3 },
  cancelled: { title: "Order cancelled.", line: "Message us if that's unexpected.", at: -1 },
};

// Reached only through the unguessable token. Shows items and totals, never the
// customer's address or phone, so a forwarded link leaks nothing personal.
export default async function OrderPage({ params }: PageProps<"/order/[token]">) {
  await connection();
  const { token } = await params;
  if (!hasDb || !/^[A-Za-z0-9_-]{10,40}$/.test(token)) notFound();
  const [o] = await db.select().from(orders).where(eq(orders.token, token)).limit(1);
  if (!o) notFound();
  const [items, s] = await Promise.all([db.select().from(orderItems).where(eq(orderItems.orderId, o.id)), getSettings()]);
  const st = STATUS[o.status];

  return (
    <section className="mx-auto w-full max-w-[760px] px-4 py-14 sm:px-6">
      <Stagger className="rounded-[20px] border border-rule bg-white p-7 sm:p-10">
        <Rise className="flex items-center gap-4">
          {o.status !== "cancelled" && <CheckBadge />}
          <span className="font-mono text-xs tracking-[.12em] text-red">ORDER {orderNo(o.id)}</span>
        </Rise>
        <Rise>
          <h1 className="display mt-5 text-[clamp(52px,10vw,104px)] leading-[.92] text-balance uppercase italic">{st.title}</h1>
        </Rise>
        <Rise>
          <p className="mt-4 text-[clamp(22px,3.6vw,30px)] leading-tight font-semibold text-balance">{st.line}</p>
          {o.status === "new" && (
            <p className="mt-3 text-[16px] leading-relaxed text-muted">
              Thanks, {o.customerName.split(" ")[0]}. Keep your phone nearby: we&apos;ll call or message you before anything ships.
            </p>
          )}
        </Rise>
        {st.at >= 0 && (
          <Rise className="mt-8 rounded-[14px] bg-ink px-4 py-5">
            <Lights steps={STEPS} at={st.at} />
          </Rise>
        )}
        {o.customerUpdate && (
          <Rise className="mt-4 rounded-[14px] border border-rule bg-paper p-4">
            <p className="font-mono text-[11px] tracking-[.12em] text-faint">
              UPDATE · {o.updatedAt.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "Asia/Kathmandu" })}
            </p>
            <p className="mt-1 text-[15px] whitespace-pre-line">{o.customerUpdate}</p>
          </Rise>
        )}
        <Rise>
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
          <p className="mt-6 text-xs text-faint">
            This page shows your order&apos;s latest status. Find it again any time on{" "}
            <Link href={`/track?order=${orderNo(o.id)}`} className="underline hover:text-red">
              Track order
            </Link>{" "}
            with {orderNo(o.id)} and your phone number.
          </p>
        </Rise>
      </Stagger>
      <div className="mt-6 flex flex-col gap-4">
        <InstagramCta url={s.instagramUrl} handle={s.instagramHandle} text="Questions about your order?" />
        <Link href="/shop" className="text-center text-sm font-semibold underline">Keep shopping</Link>
      </div>
    </section>
  );
}
