"use server";

import { updateTag } from "next/cache";
import { after } from "next/server";
import { z } from "zod";
import { hasDb } from "@/db";
import { getSettings, TAGS } from "@/lib/data";
import { isEmail } from "@/lib/email";
import { mapLink } from "@/lib/map-link";
import { PROVINCES, provinceOf, zoneFor } from "@/lib/nepal";
import { CheckoutError, loadVariants, notifyNewOrder, placeOrder } from "@/lib/orders";
import { normalizeBag, quote, type BagLine, type Quote } from "@/lib/pricing";

const Lines = z.array(z.object({ variantId: z.number().int().positive(), qty: z.number().int().positive() })).max(50);

/** Server-side price and stock check for the bag, used by the checkout page. */
export async function quoteBag(lines: BagLine[], district: string | null): Promise<Quote> {
  const parsed = Lines.safeParse(lines);
  if (!parsed.success || !hasDb) return { lines: [], problems: [], subtotal: 0, deliveryFee: 0, total: 0 };
  const bag = normalizeBag(parsed.data);
  const s = await getSettings();
  const zone = district ? zoneFor(district, s.deliveryZones) : null;
  return quote(bag, await loadVariants(bag.map((l) => l.variantId)), zone, s.freeDeliveryOver);
}

const Customer = z.object({
  customerName: z.string().trim().min(2, "Enter your name.").max(120),
  phone: z
    .string()
    .trim()
    .transform((s) => s.replace(/[\s-]/g, ""))
    .pipe(z.string().regex(/^(\+?977)?\d{7,10}$/, "Enter a valid phone number.")),
  // Same check as the form's, so only a real-looking address is ever stored.
  email: z
    .string()
    .trim()
    .toLowerCase()
    .refine((e) => !e || isEmail(e), "Enter a valid email, like name@gmail.com, or leave it empty.")
    .transform((e) => e || null),
  province: z.enum(PROVINCES.map((p) => p.name), "Choose your province."),
  city: z.string().trim().refine((d) => provinceOf(d) !== null, "Choose your district."),
  address: z.string().trim().min(4, "Enter your delivery address.").max(500),
  landmark: z.string().trim().max(200).transform((n) => n || null),
  mapUrl: z
    .string()
    .trim()
    .max(2000)
    .refine((s) => !s || mapLink(s) !== null, "Paste a Google Maps link, or use your current location.")
    .transform((s) => (s ? mapLink(s) : null)),
  mapAddress: z.string().trim().max(300).transform((n) => n || null),
  note: z.string().trim().max(1000).transform((n) => n || null),
}).refine((c) => provinceOf(c.city) === c.province, { path: ["city"], message: "That district isn't in the province you chose." });

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
    province: g("province"),
    city: g("district"),
    address: g("address"),
    landmark: g("landmark"),
    mapUrl: g("mapUrl"),
    mapAddress: g("mapAddress"),
    note: g("note"),
  });
  if (!parsed.success) {
    // The form's field is "district"; the column it lands in is "city".
    const fields = Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0]) === "city" ? "district" : String(i.path[0]), i.message]));
    return { ok: false, error: "Check the highlighted fields.", fields };
  }

  try {
    // The pin's address only means something alongside the pin.
    const c = { ...parsed.data, mapAddress: parsed.data.mapUrl ? parsed.data.mapAddress : null };
    const order = await placeOrder(normalizeBag(bag), c, await getSettings());
    // Stock changed: product pages and "sold out" badges must refresh.
    updateTag(TAGS.products);
    // After the response: the customer never waits on, or sees, a slow or failing mail server.
    after(() => notifyNewOrder(order.id).catch((e) => console.error("Order email failed:", e)));
    return { ok: true, token: order.token };
  } catch (e) {
    if (e instanceof CheckoutError) return { ok: false, error: e.message, problems: e.problems };
    console.error(e);
    return { ok: false, error: "Something went wrong placing your order. Nothing was charged. Please try again or DM us on Instagram." };
  }
}
