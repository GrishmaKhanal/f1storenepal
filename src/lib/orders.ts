import "server-only";
import { randomBytes } from "node:crypto";
import { and, eq, gte, inArray, isNotNull, sql } from "drizzle-orm";
import { db, withTx, type Tx } from "@/db";
import { orderItems, orders, products, productVariants, type OrderStatus, type SiteSettings } from "@/db/schema";
import { quote, type BagLine, type PricedVariant, type Quote } from "./pricing";

/** Fresh price and stock rows for the variants in a bag. */
export async function loadVariants(ids: number[], q: Pick<Tx, "select"> = db): Promise<PricedVariant[]> {
  if (!ids.length) return [];
  const rows = await q
    .select({
      variantId: productVariants.id,
      productId: products.id,
      productName: products.name,
      productSlug: products.slug,
      variantLabel: productVariants.label,
      variantPrice: productVariants.price,
      productPrice: products.price,
      stock: productVariants.stock,
      status: products.status,
    })
    .from(productVariants)
    .innerJoin(products, eq(products.id, productVariants.productId))
    .where(inArray(productVariants.id, ids));
  return rows.map((r) => ({
    variantId: r.variantId,
    productId: r.productId,
    productName: r.productName,
    productSlug: r.productSlug,
    variantLabel: r.variantLabel,
    unitPrice: r.variantPrice ?? r.productPrice,
    stock: r.stock,
    active: r.status === "active",
  }));
}

export type Customer = {
  customerName: string;
  phone: string;
  email: string | null;
  city: string;
  address: string;
  note: string | null;
  deliveryZone: string | null;
  paymentMethod: string;
};

export class CheckoutError extends Error {
  constructor(
    message: string,
    public problems: Quote["problems"] = [],
  ) {
    super(message);
  }
}

/**
 * Prices the bag from the database and, in one transaction, takes stock and writes the
 * order. Stock is only decremented where `stock >= qty`, so two customers racing for the
 * last item can't both get it: the second one gets a CheckoutError.
 */
export async function placeOrder(bag: BagLine[], c: Customer, s: SiteSettings) {
  const zone = s.deliveryZones.find((z) => z.name === c.deliveryZone) ?? null;
  if (s.deliveryZones.length && !zone) throw new CheckoutError("Choose a delivery area.");
  if (!s.paymentMethods.some((p) => p.key === c.paymentMethod)) throw new CheckoutError("Choose a payment method.");

  return withTx(async (tx) => {
    const variants = await loadVariants(
      bag.map((l) => l.variantId),
      tx,
    );
    const q = quote(bag, variants, zone, s.freeDeliveryOver);
    if (q.problems.length) throw new CheckoutError("Some items in your bag changed.", q.problems);
    if (!q.lines.length) throw new CheckoutError("Your bag is empty.");

    for (const l of q.lines) {
      const v = variants.find((x) => x.variantId === l.variantId)!;
      if (v.stock == null) continue;
      const updated = await tx
        .update(productVariants)
        .set({ stock: sql`${productVariants.stock} - ${l.qty}` })
        .where(and(eq(productVariants.id, l.variantId), isNotNull(productVariants.stock), gte(productVariants.stock, l.qty)))
        .returning({ id: productVariants.id });
      if (!updated.length) {
        throw new CheckoutError("Some items in your bag changed.", [{ variantId: l.variantId, name: l.productName, reason: "stock" }]);
      }
    }

    const token = randomBytes(12).toString("base64url");
    const [order] = await tx
      .insert(orders)
      .values({ ...c, token, subtotal: q.subtotal, deliveryFee: q.deliveryFee, total: q.total })
      .returning({ id: orders.id, token: orders.token });
    await tx.insert(orderItems).values(
      q.lines.map((l) => ({
        orderId: order.id,
        productId: l.productId,
        variantId: l.variantId,
        productName: l.productName,
        variantLabel: l.variantLabel,
        unitPrice: l.unitPrice,
        quantity: l.qty,
      })),
    );
    return order;
  });
}

/**
 * Changes an order's status. Cancelling puts tracked stock back; moving a cancelled
 * order back to an active status takes it again (and fails if it's no longer there).
 */
export async function setOrderStatus(orderId: number, next: OrderStatus) {
  return withTx(async (tx) => {
    const [o] = await tx.select({ status: orders.status }).from(orders).where(eq(orders.id, orderId)).for("update");
    if (!o) throw new Error("Order not found.");
    if (o.status === next) return;
    const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, orderId));

    if (next === "cancelled") {
      for (const i of items) {
        if (!i.variantId) continue;
        await tx
          .update(productVariants)
          .set({ stock: sql`${productVariants.stock} + ${i.quantity}` })
          .where(and(eq(productVariants.id, i.variantId), isNotNull(productVariants.stock)));
      }
    } else if (o.status === "cancelled") {
      for (const i of items) {
        if (!i.variantId) continue;
        const [v] = await tx.select({ stock: productVariants.stock }).from(productVariants).where(eq(productVariants.id, i.variantId));
        if (!v || v.stock == null) continue;
        if (v.stock < i.quantity) throw new Error(`Not enough stock to restore this order (${i.productName}).`);
        await tx
          .update(productVariants)
          .set({ stock: sql`${productVariants.stock} - ${i.quantity}` })
          .where(eq(productVariants.id, i.variantId));
      }
    }
    await tx.update(orders).set({ status: next, updatedAt: new Date() }).where(eq(orders.id, orderId));
  });
}
