import { test } from "node:test";
import assert from "node:assert/strict";
import { collectionDescription, collectionIntro, fitDescription, isFileNameAlt, paymentSentence, productDescription, productImageAlt, whatsSold, withImageAlts } from "../src/lib/seo";

const payments = ["Cash on delivery", "eSewa", "Khalti", "Bank transfer"];

const product = (o: Partial<Parameters<typeof productDescription>[0]> & { name: string }) => ({
  brand: null,
  scale: null,
  price: null,
  team: null,
  driver: null,
  category: null,
  variants: [],
  ...o,
});

const leclerc = product({
  name: "Bburago F1 Car 1:43 #16 Charles Leclerc — Ferrari",
  brand: "Bburago",
  scale: "1:43",
  price: 4050,
  team: { name: "Ferrari" },
  driver: { name: "Charles Leclerc" },
  category: { name: "Model cars" },
  variants: [{ price: 4050 }],
});

test("payment labels read as one sentence, keeping brand names' casing", () => {
  assert.equal(paymentSentence(payments), "Cash on delivery, eSewa, Khalti or bank transfer.");
  assert.equal(paymentSentence(["eSewa"]), "eSewa.");
  assert.equal(paymentSentence([]), "");
});

test("product description doesn't repeat what the name already says", () => {
  const d = productDescription(leclerc, payments);
  assert.equal(d, "Bburago F1 Car 1:43 #16 Charles Leclerc — Ferrari. Rs 4,050. F1 model cars delivered across Nepal. Cash on delivery, eSewa, Khalti or bank transfer.");
});

test("product description adds brand, driver and team the name leaves out, dropping the least useful parts to fit", () => {
  const d = productDescription(
    product({ name: "Ferrari SF-25 with display case", brand: "Bburago", scale: "1:43", team: { name: "Ferrari" }, driver: { name: "Lewis Hamilton" }, category: { name: "Diecast" }, variants: [{ price: 5499 }] }),
    payments,
  );
  assert.equal(d, "Ferrari SF-25 with display case by Bburago, for Lewis Hamilton fans. Rs 5,499. Delivered across Nepal. Cash on delivery, eSewa, Khalti or bank transfer.");
  assert.ok(d.length <= 155);
});

test("product description keeps the scale when there's room", () => {
  const d = productDescription(product({ name: "Ferrari SF-25", brand: "Bburago", scale: "1:43", category: { name: "Diecast" }, variants: [{ price: 5499 }] }), payments);
  assert.equal(d, "Ferrari SF-25 by Bburago, 1:43 scale. Rs 5,499. F1 diecast delivered across Nepal. Cash on delivery, eSewa, Khalti or bank transfer.");
});

test("product description without a price or payment methods", () => {
  const d = productDescription(product({ name: "F1: The Movie Wall Poster", brand: "Draftt", category: { name: "Wall Posters" }, variants: [{ price: null }] }));
  assert.equal(d, "F1: The Movie Wall Poster by Draftt. F1 wall posters delivered across Nepal.");
});

test("product description says 'From' when options are priced differently", () => {
  const d = productDescription(product({ name: "Team cap", variants: [{ price: 2500 }, { price: 1800 }, { price: null }] }));
  assert.equal(d, "Team cap. From Rs 1,800. Delivered across Nepal.");
});

test("product description falls back to the product price with no variants, and doesn't double an F1 category", () => {
  const d = productDescription(product({ name: "Scuderia keyring.", price: 900, category: { name: "F1 Keychains" } }));
  assert.equal(d, "Scuderia keyring. Rs 900. F1 keychains delivered across Nepal.");
});

test("product description never exceeds 155 characters, clipping a long name at a word", () => {
  const long = "Limited edition ".repeat(12).trim();
  const d = productDescription(product({ name: long, variants: [{ price: 4050 }] }), payments);
  assert.ok(d.length <= 155, `${d.length}`);
  assert.match(d, /^Limited edition .*\w… Rs 4,050\. Delivered across Nepal\.$/);
});

test("file-name alts are recognised; written alts are not", () => {
  for (const junk of ["CL", "LH2", "MV2", "01", "", "  ", "20240512", "#44", "IMG_2041", "lh2-front.jpg", "DSC00123"]) assert.equal(isFileNameAlt(junk), true, junk);
  for (const real of ["Charles Leclerc SF 25 02", "Bburago Ferrari SF-25 in its display case", "Ferrari", "फेरारी कार"]) assert.equal(isFileNameAlt(real), false, real);
});

test("product image alt falls back to the product name and photo number", () => {
  assert.equal(productImageAlt("LH2", "Bburago F1 Car 1:43 #44 Lewis Hamilton — Ferrari", 1), "Bburago F1 Car 1:43 #44 Lewis Hamilton — Ferrari, photo 2");
  assert.equal(productImageAlt("", "Team cap", 0), "Team cap, photo 1");
  assert.equal(productImageAlt(" Charles Leclerc SF 25 02 ", "x", 0), "Charles Leclerc SF 25 02");
});

test("withImageAlts fixes every image without touching the original", () => {
  const p = { name: "Poster", slug: "poster", images: [{ src: "a", alt: "01" }, { src: "b", alt: "Poster on a wall" }, { src: "c", alt: "03" }] };
  const out = withImageAlts(p);
  assert.deepEqual(out.images.map((i) => i.alt), ["Poster, photo 1", "Poster on a wall", "Poster, photo 3"]);
  assert.equal(out.images[0].src, "a");
  assert.equal(out.slug, "poster");
  assert.equal(p.images[0].alt, "01");
});

const item = (o: { category?: string; brand?: string; driver?: string; team?: string }) => ({
  brand: o.brand ?? null,
  category: o.category ? { name: o.category } : null,
  driver: o.driver ? { name: o.driver } : null,
  team: o.team ? { name: o.team } : null,
});

test("team intro names what's sold and the drivers in it", () => {
  const ps = [
    item({ category: "Model cars", brand: "Bburago", driver: "Charles Leclerc", team: "Ferrari" }),
    item({ category: "Model cars", brand: "Bburago", driver: "Lewis Hamilton", team: "Ferrari" }),
    item({ category: "Wall Posters", brand: "LiveMad", driver: "Lewis Hamilton", team: "Ferrari" }),
  ];
  assert.equal(collectionIntro(ps, { subject: "Ferrari", featuring: ["driver"] }), "Ferrari model cars and wall posters featuring Lewis Hamilton and Charles Leclerc, delivered across Nepal.");
});

test("driver intro names what's sold, and the brand when it's the only one", () => {
  const ps = [item({ category: "Model cars", brand: "Bburago", driver: "Lewis Hamilton" })];
  assert.equal(collectionIntro(ps, { subject: "Lewis Hamilton" }), "Lewis Hamilton model cars by Bburago, delivered across Nepal.");
});

test("category intro features the top drivers, falling back to teams", () => {
  const cars = ["Max Verstappen", "Lewis Hamilton", "Charles Leclerc", "Lando Norris"].map((driver) => item({ category: "Model cars", brand: "Bburago", driver }));
  assert.equal(collectionIntro(cars, { featuring: ["driver", "team"] }), "F1 model cars by Bburago featuring Max Verstappen, Lewis Hamilton, Charles Leclerc and more, delivered across Nepal.");
  const caps = [item({ category: "Caps", team: "McLaren" }), item({ category: "Caps", team: "Ferrari" }), item({ category: "Caps", team: "Ferrari" })];
  assert.equal(collectionIntro(caps, { featuring: ["driver", "team"] }), "F1 caps featuring Ferrari and McLaren, delivered across Nepal.");
  assert.equal(collectionIntro([item({ category: "Wall Posters", brand: "Draftt" })], { featuring: ["driver", "team"] }), "F1 wall posters by Draftt, delivered across Nepal.");
});

test("collection intro is empty for an empty collection and generic without categories", () => {
  assert.equal(collectionIntro([], { subject: "Ferrari" }), null);
  assert.equal(collectionIntro([item({})], { subject: "Ferrari" }), "Ferrari merchandise, delivered across Nepal.");
});

test("fitDescription drops trailing parts that don't fit", () => {
  assert.equal(fitDescription(["Ferrari model cars, delivered across Nepal.", "Cash on delivery, eSewa, Khalti or bank transfer."]), "Ferrari model cars, delivered across Nepal. Cash on delivery, eSewa, Khalti or bank transfer.");
  assert.equal(fitDescription(["a".repeat(120), "b".repeat(40)]), "a".repeat(120));
  assert.equal(fitDescription([null, "", "Only this."]), "Only this.");
  assert.equal(fitDescription([]), "");
});

test("whatsSold names the categories actually in a collection", () => {
  assert.equal(whatsSold([item({ category: "Wall Posters" }), item({ category: "Model cars" }), item({ category: "Model cars" })]), "model cars and wall posters");
  assert.equal(whatsSold([item({})]), null);
  assert.equal(whatsSold([]), null);
});

test("collection description adds payment options to the intro, and is honest about an empty collection", () => {
  assert.equal(
    collectionDescription("Ferrari model cars and wall posters, delivered across Nepal.", "Ferrari F1 merchandise", payments),
    "Ferrari model cars and wall posters, delivered across Nepal. Cash on delivery, eSewa, Khalti or bank transfer.",
  );
  const empty = collectionDescription(null, "F1 caps", payments);
  assert.equal(empty, "F1 caps: nothing listed right now. Check back soon, or ask us on Instagram.");
  assert.doesNotMatch(empty, /deliver|cash/i);
});
