import "server-only";
import { createTransport } from "nodemailer";
import type { Order, OrderItem, SiteSettings } from "@/db/schema";
import { ADMIN_PUBLIC } from "./admin-path";
import { mapLink } from "./map-link";
import { orderNo, rs } from "./money";
import { SITE_URL } from "./site";
import { wordmark } from "./wordmark";

// Order emails over plain SMTP (Gmail, Zoho, any provider): "new order" to the store,
// "order received" to the customer when they gave an email. All settings come from
// env; with SMTP missing, nothing is sent and checkout carries on as before.

const list = (v: string | undefined) =>
  (v ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

export type SmtpConfig = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string | null;
  to: string[]; // the store's inbox; empty = no store email
  cc: string[];
};

export function smtpConfig(env: Record<string, string | undefined> = process.env): SmtpConfig | null {
  const { SMTP_HOST: host, SMTP_USER: user, SMTP_PASS: pass } = env;
  if (!host || !user || !pass) return null;
  const port = Number(env.SMTP_PORT || 465);
  // 465 talks TLS from the first byte; 587 (and 25) start plain and upgrade with STARTTLS.
  return { host, port, secure: port === 465, user, pass, from: env.SMTP_FROM || null, to: list(env.ORDER_EMAIL_TO), cc: list(env.ORDER_EMAIL_CC) };
}

type Store = Pick<SiteSettings, "storeName" | "phone" | "instagramHandle">;

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const oneLine = (s: string) => s.replace(/[\r\n]+/g, " ").trim();
// Local numbers get Nepal's code so the WhatsApp link works from any phone.
const intl = (phone: string) => {
  const d = phone.replace(/\D/g, "");
  return d.length === 10 ? `977${d}` : d;
};
const area = (o: Order) => (o.province ? `${o.city}, ${o.province} Province` : o.city);
const lines = (rows: (string | null | undefined | false)[]) => rows.filter((l) => typeof l === "string").join("\n");

const row = (label: string, value: string) =>
  `<tr><td style="padding:4px 12px 4px 0;color:#6f6b65;vertical-align:top;white-space:nowrap">${label}</td><td style="padding:4px 0">${value}</td></tr>`;
const link = (href: string, label: string) => `<a href="${esc(href)}" style="color:#e10600">${esc(label)}</a>`;
const button = (href: string, label: string) =>
  `<p style="margin:0 0 16px"><a href="${esc(href)}" style="display:inline-block;background:#111;color:#fff;padding:10px 18px;border-radius:999px;text-decoration:none;font-weight:600">${esc(label)}</a></p>`;
// A hosted image, not an inline one: Gmail and most apps block data: URLs, and an
// attached image would make every email heavier.
const LOGO = "https://lightsoutnepal.bit-overflow.com/assets/logo.png";

function wrap(storeName: string, body: string) {
  const [lead, last] = wordmark(storeName);
  const header = `<table role="presentation" style="border-collapse:collapse;margin:0 0 24px"><tr>
<td style="padding:0 12px 0 0;vertical-align:middle"><img src="${LOGO}" width="48" height="48" alt="${esc(storeName)}" style="display:block;border:0;border-radius:50%"></td>
<td style="vertical-align:middle;font-size:20px;font-weight:800;letter-spacing:.02em">${esc(lead)}${last ? ` <span style="color:#e10600">${esc(last)}</span>` : ""}</td>
</tr></table>`;
  return `<div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;font-size:15px;line-height:1.5;color:#111;max-width:560px">\n${header}\n${body}\n</div>`;
}

const heading = (t: string) => `<p style="margin:20px 0 6px;font-size:12px;font-weight:700;letter-spacing:.12em;color:#6f6b65">${t}</p>`;
const label = (i: OrderItem) => `${i.quantity} × ${i.productName}${i.variantLabel ? ` (${i.variantLabel})` : ""}`;

// The order as a list, then the money: "- 1 × Mercedes W16: Rs 4,299".
function itemsText(o: Order, items: OrderItem[]) {
  return [
    ...items.map((i) => `- ${label(i)}: ${rs(i.unitPrice * i.quantity)}`),
    "",
    `Subtotal: ${rs(o.subtotal)}`,
    `Delivery: ${o.deliveryFee ? rs(o.deliveryFee) : "Free"}`,
    `Total: ${rs(o.total)}`,
  ];
}

function itemsHtml(o: Order, items: OrderItem[]) {
  const cell = "padding:7px 0;border-bottom:1px solid #e7e5e1";
  return `<table style="border-collapse:collapse;width:100%;border-top:1px solid #e7e5e1">
${items.map((i) => `<tr><td style="${cell}">${i.quantity} × <b>${esc(i.productName)}</b>${i.variantLabel ? ` <span style="color:#6f6b65">(${esc(i.variantLabel)})</span>` : ""}</td><td style="${cell};text-align:right;white-space:nowrap">${rs(i.unitPrice * i.quantity)}</td></tr>`).join("\n")}
<tr><td style="padding:8px 0 0">Subtotal</td><td style="padding:8px 0 0;text-align:right">${rs(o.subtotal)}</td></tr>
<tr><td style="padding:2px 0">Delivery</td><td style="padding:2px 0;text-align:right">${o.deliveryFee ? rs(o.deliveryFee) : "Free"}</td></tr>
<tr><td style="padding:2px 0;font-weight:700">Total</td><td style="padding:2px 0;font-weight:700;text-align:right">${rs(o.total)}</td></tr>
</table>`;
}

/** "New order" for the store: what was ordered, by whom, and where it goes. */
export function orderEmail(o: Order, items: OrderItem[], storeName: string) {
  const no = orderNo(o.id);
  const admin = ADMIN_PUBLIC ? `${SITE_URL}${ADMIN_PUBLIC}/orders/${o.id}` : null;
  const pin = o.mapUrl ? mapLink(o.mapUrl) : null;
  const subject = oneLine(`New order ${no}: ${o.customerName}, ${rs(o.total)}`);

  const text = lines([
    `New order ${no} on ${storeName}`,
    "",
    "NEW ORDER FOR",
    ...itemsText(o, items),
    "",
    "BY",
    o.customerName,
    `Phone: ${o.phone} (WhatsApp: https://wa.me/${intl(o.phone)})`,
    o.email && `Email: ${o.email}`,
    "",
    "LOCATION",
    o.address,
    area(o),
    o.landmark && `Landmark: ${o.landmark}`,
    pin && `Map: ${pin}${o.mapAddress ? ` (${o.mapAddress})` : ""}`,
    o.deliveryZone && `Delivery area: ${o.deliveryZone}`,
    o.note && ["", "CUSTOMER NOTE", o.note].join("\n"),
    admin && ["", `Open in admin: ${admin}`].join("\n"),
  ]);

  const html = wrap(storeName, `<p style="margin:0 0 4px;font-size:12px;letter-spacing:.12em;color:#e10600">ORDER ${no}</p>
<h1 style="margin:0;font-size:26px">New order · ${rs(o.total)}</h1>
${heading("NEW ORDER FOR")}
${itemsHtml(o, items)}
${heading("BY")}
<p style="margin:0"><b>${esc(o.customerName)}</b><br>${link(`tel:${o.phone}`, o.phone)} · ${link(`https://wa.me/${intl(o.phone)}`, "WhatsApp")}${o.email ? `<br>${link(`mailto:${o.email}`, o.email)}` : ""}</p>
${heading("LOCATION")}
<p style="margin:0">${esc(o.address).replace(/\n/g, "<br>")}<br>${esc(area(o))}</p>
<table style="border-collapse:collapse;margin-top:6px">
${o.landmark ? row("Landmark", esc(o.landmark)) : ""}
${pin ? row("Map", `${link(pin, "Open pin in Google Maps")}${o.mapAddress ? `<br><span style="color:#6f6b65">${esc(o.mapAddress)}</span>` : ""}`) : ""}
${o.deliveryZone ? row("Delivery area", esc(o.deliveryZone)) : ""}
</table>
${o.note ? `${heading("CUSTOMER NOTE")}<p style="background:#f7f6f4;padding:12px;border-radius:8px;margin:0">${esc(o.note).replace(/\n/g, "<br>")}</p>` : ""}
${admin ? `<div style="margin-top:24px">${button(admin, "Open order in admin")}</div>` : ""}`);

  return { subject, text, html };
}

/** "Thanks for your order" for the customer. Only what they gave us, and never the admin link. */
export function customerEmail(o: Order, items: OrderItem[], store: Store) {
  const no = orderNo(o.id);
  const first = o.customerName.split(" ")[0];
  const page = `${SITE_URL}/order/${o.token}`;
  const ig = store.instagramHandle ? `@${store.instagramHandle.replace(/^@+/, "")}` : null;
  const help = [store.phone && `call ${store.phone}`, ig && `DM ${ig} on Instagram`].filter(Boolean).join(" or ");
  const subject = oneLine(`Thanks for your order ${no} · ${store.storeName}`);
  const soon = "We'll contact you on WhatsApp or call you soon.";
  const detail = `We'll message or call ${o.phone} to confirm your order, so please keep your phone nearby and wait for us. Nothing to pay yet: we'll agree payment then.`;
  const questions = `Questions? Reply to this email${help ? `, ${help}` : ""}. Quote ${no}.`;

  const text = lines([
    `Thanks for your order, ${first}!`,
    "",
    `YOUR ORDER (${no})`,
    ...itemsText(o, items),
    "",
    soon,
    detail,
    "",
    "DELIVERING TO",
    o.address,
    area(o),
    o.landmark && `Landmark: ${o.landmark}`,
    "",
    `View your order: ${page}`,
    "",
    questions,
  ]);

  const html = wrap(store.storeName, `<p style="margin:0 0 4px;font-size:12px;letter-spacing:.12em;color:#e10600">ORDER ${no}</p>
<h1 style="margin:0;font-size:28px">Thanks for your order, ${esc(first)}!</h1>
${heading("YOUR ORDER")}
${itemsHtml(o, items)}
<p style="margin:20px 0 0;padding:14px 16px;background:#f7f6f4;border-radius:10px"><b>${esc(soon)}</b><br><span style="color:#4a4742">${esc(detail)}</span></p>
${heading("DELIVERING TO")}
<p style="margin:0 0 20px">${esc(o.address).replace(/\n/g, "<br>")}<br>${esc(area(o))}${o.landmark ? `<br><span style="color:#6f6b65">Landmark: ${esc(o.landmark)}</span>` : ""}</p>
${button(page, "View your order")}
<p style="margin:0 0 24px;color:#4a4742">${esc(questions)}</p>
<p style="margin:0;font-size:12px;color:#8a857e">You're getting this because you placed an order at ${esc(store.storeName)}.</p>`);

  return { subject, text, html };
}

function transport(cfg: SmtpConfig) {
  return createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: { user: cfg.user, pass: cfg.pass },
    // Fail fast: this runs after the customer's response, but a hung socket still holds the function open.
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });
}

export async function sendOrderEmail(o: Order, items: OrderItem[], storeName: string, cfg = smtpConfig()) {
  if (!cfg || !cfg.to.length) return false;
  await transport(cfg).sendMail({
    from: cfg.from ?? { name: storeName, address: cfg.user },
    to: cfg.to,
    cc: cfg.cc.length ? cfg.cc : undefined,
    // Replying to the email goes straight to the customer when they gave an address.
    replyTo: o.email ?? undefined,
    ...orderEmail(o, items, storeName),
  });
  return true;
}

export async function sendCustomerEmail(o: Order, items: OrderItem[], store: Store, cfg = smtpConfig()) {
  if (!cfg || !o.email) return false;
  await transport(cfg).sendMail({
    from: cfg.from ?? { name: store.storeName, address: cfg.user },
    to: o.email,
    // Their reply lands in the store's inbox, not the sending account's.
    replyTo: cfg.to[0],
    ...customerEmail(o, items, store),
  });
  return true;
}
