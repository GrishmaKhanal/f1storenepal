import { rs } from "./money";

// Fallback text for pages the owner hasn't written copy for yet, built only from
// catalog data so it never claims anything the store doesn't sell.

// Roughly what Google shows of a meta description before cutting it off.
export const DESCRIPTION_MAX = 155;

type Named = { name: string } | null;

const words = (s: string) => (s.toLowerCase().match(/\d+:\d+|[\p{L}\p{N}]+/gu) ?? []).filter((w) => w.length > 1).map((w) => (w.length > 3 ? w.replace(/s$/, "") : w));

/** True when most of `value`'s words already appear in `text`. */
function mentions(text: string, value: string) {
  const have = new Set(words(text));
  const ws = words(value);
  return ws.filter((w) => have.has(w)).length * 2 >= ws.length;
}

const list = (xs: readonly string[], conj = "and") => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} ${conj} ${xs.at(-1)}`);
const some = (xs: readonly string[], max = 3) => list(xs.length > max ? [...xs.slice(0, max), "more"] : xs);
// "Wall Posters" → "wall posters", leaving "F1" and other codes alone.
const lower = (s: string) => s.trim().replace(/\b[A-Z][a-z]+\b/g, (w) => w.toLowerCase());
export const withF1 = (s: string) => (/\b(f1|formula)\b/i.test(s) ? s : `F1 ${s}`);

function clip(s: string, max = DESCRIPTION_MAX) {
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  const at = cut.lastIndexOf(" ");
  return `${(at > 0 ? cut.slice(0, at) : cut.slice(0, max - 1)).replace(/[\s,.;:—–-]+$/, "")}…`;
}

/** Joins the parts, dropping trailing ones until the result fits. */
export function fitDescription(parts: readonly (string | null | undefined | false)[], max = DESCRIPTION_MAX): string {
  const xs = parts.filter((x): x is string => !!x);
  while (xs.length > 1 && xs.join(" ").length > max) xs.pop();
  return clip(xs.join(" "), max);
}

/** "Cash on delivery, eSewa, Khalti or bank transfer." from the checkout's payment labels. */
export function paymentSentence(labels: readonly string[]): string {
  if (!labels.length) return "";
  // Generic labels ("Bank transfer") go lower case mid-sentence; names ("Khalti", "eSewa") keep theirs.
  const xs = labels.map((l, i) => (i > 0 && /\s/.test(l.trim()) ? l.trim().replace(/^[A-Z](?=[a-z])/, (c) => c.toLowerCase()) : l.trim()));
  return `${list(xs, "or")}.`;
}

export type DescribedProduct = {
  name: string;
  brand: string | null;
  scale: string | null;
  price: number | null;
  team: Named;
  driver: Named;
  category: Named;
  variants: readonly { price: number | null }[];
};

/** Meta description for a product with none of its own. */
export function productDescription(p: DescribedProduct, payments: readonly string[] = []): string {
  const name = p.name.trim().replace(/[.!]+$/, "");
  const fresh = (v: string | null | undefined): v is string => !!v?.trim() && !mentions(name, v);
  const fans = [p.driver?.name, p.team?.name].filter(fresh);
  const prices = p.variants.map((v) => v.price).filter((x): x is number => x != null);
  const low = prices.length ? Math.min(...prices) : p.price;
  const price = low == null ? "" : `${new Set(prices).size > 1 ? "From " : ""}${rs(low)}.`;
  const parts = {
    brand: fresh(p.brand) ? ` by ${p.brand.trim()}` : "",
    scale: fresh(p.scale) ? `, ${p.scale.trim()} scale` : "",
    fans: fans.length ? `, for ${list(fans)} fans` : "",
    category: p.category ? `${withF1(lower(p.category.name))} delivered` : "Delivered",
    payments: paymentSentence(payments),
  };
  const lead = () => `${name}${parts.brand}${parts.scale}${parts.fans}.`;
  const rest = () => [price, `${parts.category} across Nepal.`, parts.payments].filter(Boolean).join(" ");
  // Least useful first.
  for (const k of ["scale", "category", "brand", "fans", "payments"] as const) {
    if (`${lead()} ${rest()}`.length <= DESCRIPTION_MAX) break;
    parts[k] = k === "category" ? "Delivered" : "";
  }
  const s = `${lead()} ${rest()}`;
  return s.length <= DESCRIPTION_MAX ? s : `${clip(lead(), DESCRIPTION_MAX - rest().length - 1)} ${rest()}`;
}

/** Alts imported from file names ("LH2", "01", "IMG_2041.jpg") describe nothing. */
export function isFileNameAlt(alt: string): boolean {
  const a = alt.trim();
  return !a || /^[\p{N}\p{P}\p{S}\s]+$/u.test(a) || (!/\s/.test(a) && (a.length <= 5 || /[\d_]|\.\w{3,4}$/.test(a)));
}

export const productImageAlt = (alt: string, name: string, index: number) => (isFileNameAlt(alt) ? `${name}, photo ${index + 1}` : alt.trim());

export function withImageAlts<T extends { name: string; images: readonly { alt: string }[] }>(p: T): T {
  return { ...p, images: p.images.map((img, i) => ({ ...img, alt: productImageAlt(img.alt, p.name, i) })) };
}

type Listed = { brand: string | null; category: Named; driver: Named; team: Named };

/** Distinct names, most-used first (ties keep listing order). */
function ranked(xs: readonly (string | null | undefined)[]) {
  const n = new Map<string, number>();
  for (const x of xs) if (x?.trim()) n.set(x.trim(), (n.get(x.trim()) ?? 0) + 1);
  return [...n.keys()].sort((a, b) => n.get(b)! - n.get(a)!);
}

/** What a collection holds, from its products' categories: "model cars and wall posters". */
export function whatsSold(products: readonly { category: Named }[]): string | null {
  const cats = ranked(products.map((p) => p.category?.name)).map(lower);
  return cats.length ? some(cats) : null;
}

/** Intro for a team, driver or category page with no description of its own: what's sold, by whom, featuring whom. */
export function collectionIntro(products: readonly Listed[], { subject, featuring = [] }: { subject?: string; featuring?: readonly ("driver" | "team")[] }): string | null {
  if (!products.length) return null;
  const what = whatsSold(products) ?? "merchandise";
  const head = subject ? `${subject} ${what}` : withF1(what);
  const brands = ranked(products.map((p) => p.brand));
  const brand = brands.length === 1 && products.every((p) => p.brand?.trim()) && !mentions(head, brands[0]) ? ` by ${brands[0]}` : "";
  const names = featuring.map((k) => ranked(products.map((p) => p[k]?.name)).filter((n) => n !== subject)).find((ns) => ns.length) ?? [];
  return `${head}${brand}${names.length ? ` featuring ${some(names)}` : ""}, delivered across Nepal.`;
}

/** Meta description for a collection page with none of its own. An empty one says so rather than promising stock. */
export const collectionDescription = (intro: string | null, label: string, payments: readonly string[]) =>
  intro ? fitDescription([intro, paymentSentence(payments)]) : `${label}: nothing listed right now. Check back soon, or ask us on Instagram.`;
