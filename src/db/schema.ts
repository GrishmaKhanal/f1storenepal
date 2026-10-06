import { boolean, index, integer, jsonb, pgEnum, pgTable, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
};

/* ---------- media: bytes live in object storage, only metadata here ---------- */

export const media = pgTable("media", {
  id: serial("id").primaryKey(),
  // Object key prefix, e.g. "media/k3J9xQ". Files are "<key>-<width>.webp".
  // Never a full URL: the public origin comes from MEDIA_PUBLIC_URL at render time.
  storageKey: text("storage_key").notNull().unique(),
  name: text("name").notNull(),
  alt: text("alt").notNull(),
  width: integer("width").notNull(),
  height: integer("height").notNull(),
  // Widths actually stored (never upscaled), ascending.
  widths: integer("widths").array().notNull(),
  bytes: integer("bytes").notNull(),
  createdAt: timestamps.createdAt,
});

/* ---------- catalogue ---------- */

export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  color: text("color"),
  description: text("description"),
  logoId: integer("logo_id").references(() => media.id, { onDelete: "set null" }),
  sortOrder: integer("sort_order").notNull().default(0),
  published: boolean("published").notNull().default(true),
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  ...timestamps,
});

export const drivers = pgTable("drivers", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  number: integer("number"),
  teamId: integer("team_id").references(() => teams.id, { onDelete: "set null" }),
  portraitId: integer("portrait_id").references(() => media.id, { onDelete: "set null" }),
  description: text("description"),
  featured: boolean("featured").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  published: boolean("published").notNull().default(true),
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  ...timestamps,
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  // Listed in the Accessories menu and /accessories.
  isAccessory: boolean("is_accessory").notNull().default(false),
  // Shown as a filter tab on the home page's "New in" grid.
  showAsTab: boolean("show_as_tab").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  published: boolean("published").notNull().default(true),
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  ...timestamps,
});

export const productStatus = pgEnum("product_status", ["draft", "active", "archived"]);

export const products = pgTable(
  "products",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    description: text("description"),
    teamId: integer("team_id").references(() => teams.id, { onDelete: "set null" }),
    driverId: integer("driver_id").references(() => drivers.id, { onDelete: "set null" }),
    categoryId: integer("category_id").references(() => categories.id, { onDelete: "set null" }),
    brand: text("brand"),
    scale: text("scale"),
    // Whole rupees. null = no price shown ("Ask on Instagram"), can't be added to the bag.
    price: integer("price"),
    compareAtPrice: integer("compare_at_price"),
    badge: text("badge"),
    status: productStatus("status").notNull().default("draft"),
    sortOrder: integer("sort_order").notNull().default(0),
    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [index("products_status_idx").on(t.status)],
);

// Every product has at least one variant. A product without options has a single
// variant whose label is null, so stock and checkout logic never special-case it.
export const productVariants = pgTable(
  "product_variants",
  {
    id: serial("id").primaryKey(),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    label: text("label"),
    sku: text("sku"),
    // null = use the product price.
    price: integer("price"),
    // null = stock not tracked (always available).
    stock: integer("stock"),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [index("variants_product_idx").on(t.productId)],
);

export const productImages = pgTable(
  "product_images",
  {
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    mediaId: integer("media_id")
      .notNull()
      .references(() => media.id, { onDelete: "restrict" }),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [uniqueIndex("product_images_pk").on(t.productId, t.mediaId)],
);

/* ---------- orders (guest checkout) ---------- */

export const orderStatus = pgEnum("order_status", ["new", "confirmed", "paid", "shipped", "delivered", "cancelled"]);

export const orders = pgTable(
  "orders",
  {
    id: serial("id").primaryKey(),
    // Unguessable id for the customer's confirmation page; the numeric id is for staff.
    token: text("token").notNull().unique(),
    status: orderStatus("status").notNull().default("new"),
    customerName: text("customer_name").notNull(),
    phone: text("phone").notNull(),
    email: text("email"),
    city: text("city").notNull(),
    address: text("address").notNull(),
    note: text("note"),
    deliveryZone: text("delivery_zone"),
    paymentMethod: text("payment_method").notNull(),
    subtotal: integer("subtotal").notNull(),
    deliveryFee: integer("delivery_fee").notNull(),
    total: integer("total").notNull(),
    adminNote: text("admin_note"),
    ...timestamps,
  },
  (t) => [index("orders_status_idx").on(t.status), index("orders_created_idx").on(t.createdAt)],
);

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  // Kept nullable so deleting a product never deletes order history; the snapshot
  // columns below are what the order shows.
  productId: integer("product_id").references(() => products.id, { onDelete: "set null" }),
  variantId: integer("variant_id").references(() => productVariants.id, { onDelete: "set null" }),
  productName: text("product_name").notNull(),
  variantLabel: text("variant_label"),
  unitPrice: integer("unit_price").notNull(),
  quantity: integer("quantity").notNull(),
});

/* ---------- site settings (one JSON row, every field optional) ---------- */

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").$type<SiteSettings>().notNull(),
  updatedAt: timestamps.updatedAt,
});

export type Step = { title: string; body: string };
export type Zone = { name: string; fee: number };
export type PaymentMethod = { key: string; label: string; instructions: string | null };

// Every field is optional: an empty value hides the section that uses it.
export type SiteSettings = {
  storeName: string;
  tagline: string | null;
  location: string | null; // e.g. "Jhapa, Nepal": the footer address, not where you deliver
  streetAddress: string | null;
  phone: string | null;
  email: string | null;
  instagramUrl: string | null;
  instagramHandle: string | null;
  whatsapp: string | null;
  announcements: string[];
  heroStyle: "dark" | "light";
  heroEyebrow: string | null;
  heroTitle: string | null; // lines separated by \n; *text* is highlighted red
  heroBody: string | null;
  heroImageId: number | null;
  heroProductId: number | null;
  heroSecondaryLabel: string | null;
  heroSecondaryHref: string | null;
  heroWatermark: string | null; // the big background number, e.g. "44"
  steps: Step[];
  deliveryZones: Zone[];
  serviceAreas: string[]; // towns delivered to: home page list and areaServed in JSON-LD
  freeDeliveryOver: number | null;
  paymentMethods: PaymentMethod[];
  lowStockThreshold: number;
  deliveryInfo: string | null;
  returnsInfo: string | null;
  contactInfo: string | null;
  footerDisclaimer: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string[];
};

export type Media = typeof media.$inferSelect;
export type Team = typeof teams.$inferSelect;
export type Driver = typeof drivers.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Variant = typeof productVariants.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type OrderStatus = (typeof orderStatus.enumValues)[number];
