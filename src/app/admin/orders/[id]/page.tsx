import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orderItems, orders, products } from "@/db/schema";
import { ADMIN } from "@/lib/admin-path";
import { orderNo, rs } from "@/lib/money";
import { guard } from "../../_lib";
import { card, OrderPill, PageHeader } from "../../_components/ui";
import { OrderForm } from "./form";

export default async function OrderDetail({ params }: PageProps<"/admin/orders/[id]">) {
  await guard();
  const id = Number((await params).id);
  const [o] = Number.isInteger(id) ? await db.select().from(orders).where(eq(orders.id, id)) : [];
  if (!o) notFound();
  const items = await db.select({ i: orderItems, slug: products.slug }).from(orderItems).leftJoin(products, eq(products.id, orderItems.productId)).where(eq(orderItems.orderId, id));
  const phone = o.phone.replace(/\D/g, "");

  return (
    <>
      <PageHeader back={["Orders", `${ADMIN}/orders`]} actions={<OrderPill status={o.status} />}>{orderNo(o.id)}</PageHeader>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-5">
          <section className={`${card} p-5`}>
            <h2 className="mb-3 font-display text-xl font-bold uppercase">Items</h2>
            <ul className="divide-y divide-rule text-sm">
              {items.map(({ i, slug }) => (
                <li key={i.id} className="flex justify-between gap-4 py-2.5">
                  <span>
                    {slug && i.productId ? <Link href={`${ADMIN}/products/${i.productId}`} className="font-semibold hover:text-red">{i.productName}</Link> : <span className="font-semibold">{i.productName}</span>}
                    {i.variantLabel && <span className="text-ink-5"> · {i.variantLabel}</span>}
                    <span className="text-ink-5"> × {i.quantity} @ {rs(i.unitPrice)}</span>
                  </span>
                  <span className="tabular-nums">{rs(i.unitPrice * i.quantity)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-3 space-y-1 border-t border-rule pt-3 text-sm">
              <div className="flex justify-between"><dt>Subtotal</dt><dd className="tabular-nums">{rs(o.subtotal)}</dd></div>
              <div className="flex justify-between"><dt>Delivery {o.deliveryZone && `(${o.deliveryZone})`}</dt><dd className="tabular-nums">{rs(o.deliveryFee)}</dd></div>
              <div className="flex justify-between text-base font-semibold"><dt>Total</dt><dd className="tabular-nums">{rs(o.total)}</dd></div>
            </dl>
          </section>
          <OrderForm id={o.id} status={o.status} adminNote={o.adminNote} />
        </div>
        <aside className={`${card} space-y-3 self-start p-5 text-sm`}>
          <h2 className="font-display text-xl font-bold uppercase">Customer</h2>
          <p className="font-semibold">{o.customerName}</p>
          <p className="flex flex-wrap gap-3">
            <a href={`tel:${phone}`} className="underline">{o.phone}</a>
            <a href={`https://wa.me/${phone.length === 10 ? `977${phone}` : phone}`} target="_blank" rel="noopener" className="underline">WhatsApp</a>
            <a href={`viber://chat?number=%2B${phone.length === 10 ? `977${phone}` : phone}`} className="underline">Viber</a>
          </p>
          {o.email && <p><a href={`mailto:${o.email}`} className="underline">{o.email}</a></p>}
          <p className="whitespace-pre-line">{o.address}<br />{o.city}</p>
          <p><span className="text-ink-5">Payment:</span> {o.paymentMethod}</p>
          {o.note && <p className="rounded-lg bg-paper p-3"><span className="text-ink-5">Customer note:</span> {o.note}</p>}
          <p className="font-mono text-xs text-ink-5">Placed {o.createdAt.toISOString().slice(0, 16).replace("T", " ")} UTC</p>
        </aside>
      </div>
    </>
  );
}
