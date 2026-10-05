"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { hasDb } from "@/db";
import { getSettings, TAGS } from "@/lib/data";
import { CheckoutError, loadVariants, placeOrder } from "@/lib/orders";
import { normalizeBag, quote, type BagLine, type Quote } from "@/lib/pricing";

const Lines = z.array(z.object({ variantId: z.number().int().positive(), qty: z.number().int().positive() })).max(50);

/** Server-side price and stock check for the bag, used by the checkout page. */
export async function quoteBag(lines: BagLine[], zoneName: string | null): Promise<Quote> {
  const parsed = Lines.safeParse(lines);
  if (!parsed.success || !hasDb) return { lines: [], problems: [], subtotal: 0, deliveryFee: 0, total: 0 };
  const bag = normalizeBag(parsed.data);
  const s = await getSettings();
  const zone = s.deliveryZones.find((z) => z.name === zoneName) ?? null;
  return quote(bag, await loadVariants(bag.map((l) => l.variantId)), zone, s.freeDeliveryOver);
}

const Customer = z.object({
  customerName: z.string().trim().min(2, "Enter your name.").max(120),
  phone: z
    .string()
    .trim()
    .transform((s) => s.replace(/[\s-]/g, ""))
    .pipe(z.string().regex(/^(\+?977)?\d{7,10}$/, "Enter a valid phone number.")),
  email: z.union([z.literal(""), z.email("Enter a valid email or leave it empty.")]).transform((e) => e || null),
  city: z.string().trim().min(2, "Enter your city or district.").max(120),
  address: z.string().trim().min(4, "Enter your delivery address.").max(500),
  note: z.string().trim().max(1000).transform((n) => n || null),
  deliveryZone: z.string().trim().max(120).transform((n) => n || null),
  paymentMethod: z.string().trim().min(1, "Choose a payment method."),
});

export type CheckoutState =
  | { ok: true; token: string }
  | { ok: false; error: string; problems?: Quote["problems"]; fields?: Record<string, string> }
  | undefined;

export async function submitOrder(_: CheckoutState, fd: FormData): Promise<CheckoutState> {
  // Bots fill every field; people never see this one.
  if (String(fd.get("website") ?? "")) return { ok: false, error: "Couldn't place the order." };
  if (!hasDb) return { ok: false, error: "Online ordering isn't available right now. Please order on Instagram." };

  let bag: BagLine[];
  try {
    bag = Lines.parse(JSON.parse(String(fd.get("bag") ?? "[]")));
  } catch {
    return { ok: false, error: "Your bag couldn't be read. Refresh the page and try again." };
  }

  const g = (k: string) => String(fd.get(k) ?? "");
  const parsed = Customer.safeParse({
    customerName: g("customerName"),
    phone: g("phone"),
    email: g("email"),
    city: g("city"),
    address: g("address"),
    note: g("note"),
    deliveryZone: g("deliveryZone"),
    paymentMethod: g("paymentMethod"),
  });
  if (!parsed.success) {
    const fields = Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0]), i.message]));
    return { ok: false, error: "Check the highlighted fields.", fields };
  }

  try {
    const order = await placeOrder(normalizeBag(bag), parsed.data, await getSettings());
    // Stock changed: product pages and "sold out" badges must refresh.
    updateTag(TAGS.products);
    return { ok: true, token: order.token };
  } catch (e) {
    if (e instanceof CheckoutError) return { ok: false, error: e.message, problems: e.problems };
    console.error(e);
    return { ok: false, error: "Something went wrong placing your order. Nothing was charged. Please try again or DM us on Instagram." };
  }
}
