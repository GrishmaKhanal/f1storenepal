import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:net";
import type { Order, OrderItem } from "../src/db/schema";

// Read at import time by admin-path.ts and site.ts.
process.env.ADMIN_PATH = "/pit-test";
process.env.SITE_URL = "https://shop.test";
const mod = () => import("../src/lib/order-email");

const order: Order = {
  id: 12,
  token: "tok",
  status: "new",
  customerName: "Ram <b>Bahadur</b>",
  phone: "9800000000",
  email: "ram@example.com",
  city: "Jhapa",
  province: "Koshi",
  address: "Ward 5\nMain road",
  landmark: "Opposite the bus park",
  mapUrl: "https://www.google.com/maps?q=26.664600,87.987300",
  mapAddress: "Mechi Hwy, Birtamode <44400>",
  note: "Call after 5 & before 8",
  deliveryZone: "Jhapa",
  paymentMethod: null,
  subtotal: 4299,
  deliveryFee: 150,
  total: 4449,
  adminNote: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};
const items: OrderItem[] = [{ id: 1, orderId: 12, productId: 7, variantId: 7, productName: "Mercedes W16", variantLabel: null, unitPrice: 4299, quantity: 1 }];
const store = { storeName: "Lights Out Nepal", phone: "9812345678", instagramHandle: "@lightsoutnepal" };

// Just enough of an SMTP server to accept messages.
async function fakeSmtp() {
  const got: { rcpt: string[]; data: string }[] = [];
  const server = createServer((sock) => {
    let inData = false;
    let buf = "";
    let msg = { rcpt: [] as string[], data: "" };
    sock.write("220 test\r\n");
    sock.on("data", (chunk) => {
      buf += chunk.toString();
      let i;
      while ((i = buf.indexOf("\r\n")) >= 0) {
        const line = buf.slice(0, i);
        buf = buf.slice(i + 2);
        if (inData) {
          if (line === ".") {
            inData = false;
            got.push(msg);
            msg = { rcpt: [], data: "" };
            sock.write("250 queued\r\n");
          } else msg.data += line + "\n";
        } else if (/^EHLO/i.test(line)) sock.write("250-test\r\n250 AUTH PLAIN LOGIN\r\n");
        else if (/^AUTH/i.test(line)) sock.write("235 ok\r\n");
        else if (/^RCPT TO:<(.+)>/i.test(line)) {
          msg.rcpt.push(line.match(/<(.+)>/)![1]);
          sock.write("250 ok\r\n");
        } else if (/^DATA/i.test(line)) {
          inData = true;
          sock.write("354 go\r\n");
        } else if (/^QUIT/i.test(line)) sock.end("221 bye\r\n");
        else sock.write("250 ok\r\n");
      }
    });
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  const port = (server.address() as { port: number }).port;
  const cfg = { host: "127.0.0.1", port, secure: false, user: "store@gmail.com", pass: "x", from: null, to: ["owner@example.com"], cc: ["partner@example.com"] };
  return { got, cfg, close: () => server.close() };
}

test("SMTP is off unless host and login are set; the store's inbox is separate", async () => {
  const { smtpConfig } = await mod();
  const full = { SMTP_HOST: "smtp.gmail.com", SMTP_USER: "u@gmail.com", SMTP_PASS: "x", ORDER_EMAIL_TO: "a@x.com, b@x.com", ORDER_EMAIL_CC: "c@x.com" };
  assert.deepEqual(smtpConfig(full), { host: "smtp.gmail.com", port: 465, secure: true, user: "u@gmail.com", pass: "x", from: null, to: ["a@x.com", "b@x.com"], cc: ["c@x.com"] });
  assert.equal(smtpConfig({ ...full, SMTP_PORT: "587" })?.secure, false);
  for (const k of ["SMTP_HOST", "SMTP_USER", "SMTP_PASS"] as const) assert.equal(smtpConfig({ ...full, [k]: "" }), null, k);
  assert.deepEqual(smtpConfig({ ...full, ORDER_EMAIL_TO: "" })?.to, []);
});

test("order email carries the delivery details, escapes customer text and links to the admin", async () => {
  const { orderEmail } = await mod();
  const m = orderEmail(order, items, "Lights Out Nepal");
  assert.equal(m.subject, "New order F1N-1012: Ram <b>Bahadur</b>, Rs 4,449");
  // What was ordered, then by whom, then where it goes.
  assert.match(m.text, /NEW ORDER FOR\n- 1 × Mercedes W16: Rs 4,299[\s\S]*\nBY\nRam <b>Bahadur<\/b>\nPhone: 9800000000[\s\S]*\nLOCATION\nWard 5\nMain road\nJhapa, Koshi Province/);
  assert.match(m.text, /Landmark: Opposite the bus park/);
  assert.match(m.text, /Map: https:\/\/www\.google\.com\/maps\?q=26\.664600,87\.987300/);
  assert.match(m.text, /Open in admin: https:\/\/shop\.test\/pit-test\/orders\/12/);
  assert.match(m.html, /Ram &lt;b&gt;Bahadur&lt;\/b&gt;/);
  assert.doesNotMatch(m.html, /<b>Bahadur<\/b>/);
  assert.match(m.html, /Call after 5 &amp; before 8/);
  assert.match(m.html, /Mechi Hwy, Birtamode &lt;44400&gt;/);
  assert.match(m.html, /Ward 5<br>Main road<br>Jhapa, Koshi Province/);
  assert.match(m.html, /https:\/\/wa\.me\/9779800000000/);
});

test("both emails open with the logo from its hosted URL and the wordmark", async () => {
  const { customerEmail, orderEmail } = await mod();
  for (const m of [orderEmail(order, items, "Lights Out Nepal"), customerEmail(order, items, store)]) {
    assert.match(m.html, /<img src="https:\/\/lightsoutnepal\.bit-overflow\.com\/assets\/logo\.png" width="48" height="48" alt="Lights Out Nepal"/);
    assert.match(m.html, /LIGHTS OUT <span style="color:#e10600">NEPAL<\/span>/);
  }
});

test("a stored map link that isn't Google Maps never reaches the email", async () => {
  const { orderEmail } = await mod();
  const m = orderEmail({ ...order, mapUrl: "javascript:alert(1)" }, items, "Lights Out Nepal");
  assert.doesNotMatch(m.html + m.text, /javascript:/);
});

test("customer email confirms the order without anything the store keeps private", async () => {
  const { customerEmail } = await mod();
  const m = customerEmail(order, items, store);
  assert.equal(m.subject, "Thanks for your order F1N-1012 · Lights Out Nepal");
  assert.match(m.html, /Thanks for your order, Ram!/);
  assert.match(m.text, /We'll contact you on WhatsApp or call you soon\./);
  assert.match(m.text, /We'll message or call 9800000000 to confirm/);
  assert.match(m.text, /YOUR ORDER \(F1N-1012\)\n- 1 × Mercedes W16: Rs 4,299/);
  assert.match(m.text, /View your order: https:\/\/shop\.test\/order\/tok/);
  assert.match(m.text, /call 9812345678 or DM @lightsoutnepal on Instagram/);
  assert.match(m.html, /Ward 5<br>Main road<br>Jhapa, Koshi Province/);
  assert.match(m.html, /Mercedes W16/);
  // Their name is escaped like everywhere else.
  assert.equal(customerEmail({ ...order, customerName: "<i>Hari</i> Thapa" }, items, store).html.includes("<i>Hari</i>"), false);
  // Never the admin link, the private note or the store's map pin.
  assert.doesNotMatch(m.html + m.text, /pit-test|admin|maps\?q=/i);
});

test("sends the store email to To and CC, replying to the customer", async () => {
  const { sendOrderEmail } = await mod();
  const smtp = await fakeSmtp();
  try {
    assert.equal(await sendOrderEmail(order, items, "Lights Out Nepal", smtp.cfg), true);
    const [msg] = smtp.got;
    assert.deepEqual(msg.rcpt.sort(), ["owner@example.com", "partner@example.com"]);
    assert.match(msg.data, /^From: Lights Out Nepal <store@gmail\.com>$/m);
    assert.match(msg.data, /^To: owner@example\.com$/m);
    assert.match(msg.data, /^Cc: partner@example\.com$/m);
    assert.match(msg.data, /^Reply-To: ram@example\.com$/m);
    assert.match(msg.data, /^Subject: New order F1N-1012/m);
  } finally {
    smtp.close();
  }
});

test("sends the customer their confirmation, with replies going to the store", async () => {
  const { sendCustomerEmail } = await mod();
  const smtp = await fakeSmtp();
  try {
    assert.equal(await sendCustomerEmail(order, items, store, smtp.cfg), true);
    const [msg] = smtp.got;
    assert.deepEqual(msg.rcpt, ["ram@example.com"]);
    assert.match(msg.data, /^To: ram@example\.com$/m);
    assert.match(msg.data, /^Reply-To: owner@example\.com$/m);
    assert.doesNotMatch(msg.data, /^Cc:/m);
    // "·" isn't ASCII, so the subject goes out RFC 2047-encoded; mail clients decode it.
    assert.match(msg.data, /^Subject: =\?UTF-8\?Q\?Thanks_for_your_order_F1N-1012/m);
  } finally {
    smtp.close();
  }
});

test("skips each email when there's nobody to send it to", async () => {
  const { sendCustomerEmail, sendOrderEmail } = await mod();
  assert.equal(await sendOrderEmail(order, items, "Lights Out Nepal", null), false);
  assert.equal(await sendCustomerEmail(order, items, store, null), false);
  const smtp = await fakeSmtp();
  try {
    assert.equal(await sendCustomerEmail({ ...order, email: null }, items, store, smtp.cfg), false);
    assert.equal(await sendOrderEmail(order, items, "Lights Out Nepal", { ...smtp.cfg, to: [] }), false);
    assert.equal(smtp.got.length, 0);
  } finally {
    smtp.close();
  }
});
