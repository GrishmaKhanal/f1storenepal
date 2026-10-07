# Schema

Source of truth: `src/db/schema.ts`. SQL: `drizzle/0000_init.sql` plus any later migrations. Prices are **whole rupees** (`integer`).

## Catalogue

| Table | Holds | Notes |
|---|---|---|
| `teams` | Constructors | `slug` unique (URL `/teams/<slug>`), `color` hex for stripes and dots, optional `logo_id` → `media`, `published`, `sort_order`, SEO fields. |
| `drivers` | Drivers | `number`, `team_id` → `teams` (set null), optional `portrait_id` → `media`, `featured` (home page cards). |
| `categories` | Diecast, Caps, Keychains… | `is_accessory` (Accessories menu/page/tiles), `show_as_tab` (home New-in tabs). URL `/accessories/<slug>`. |
| `products` | Things for sale | `team_id`, `driver_id`, `category_id` (all optional, set null on delete), `brand`, `scale`, `price` (current selling price; null = "Ask on Instagram", can't be bagged), `compare_at_price` (original price, shown struck through when higher than `price`), `badge`, `status` enum `draft / active / archived` (only `active` is public), `published_at` (sets "New in" order, stamped the first time it goes active). |
| `product_variants` | Options with their own stock | **Every product has ≥ 1.** A product without options has one variant with `label` null. `price` null = product price; `stock` null = not tracked (always available), `0` = sold out. Cascade-deleted with the product. |
| `product_images` | Ordered gallery | `(product_id, media_id)` unique, `sort_order` 0 = main photo. `media_id` is `restrict`, so a used image can't be deleted. |
| `media` | Image metadata | `storage_key` (e.g. `products/k3J9xQ…`; files are `<key>-<width>.webp` in the bucket), `widths` int[], `width`, `height`, `bytes`, `name`, `alt`. **No bytes, no URLs.** |

## Orders

| Table | Holds | Notes |
|---|---|---|
| `orders` | Guest orders | `token` (unique, random; customer's confirmation URL), `status` enum `new / confirmed / paid / shipped / delivered / cancelled`, customer name, phone, optional email, city, address, note, `delivery_zone`, `payment_method` (key from settings), `subtotal`, `delivery_fee`, `total`, private `admin_note`. Order number shown as `F1N-<1000 + id>`. |
| `order_items` | Lines | Snapshots: `product_name`, `variant_label`, `unit_price`, `quantity`. `product_id` / `variant_id` set null if the product is deleted, so history survives. |

## Settings

| Table | Holds | Notes |
|---|---|---|
| `settings` | All editable site content | One row, `key = 'site'`, `value` JSONB `SiteSettings`: store name, location, contact, Instagram, announcements, hero, steps, delivery zones, delivery towns (`serviceAreas`), free-delivery threshold, payment methods, low-stock threshold, page copy, SEO defaults and keywords. Missing fields fall back to `src/content/seed.ts`. |

Drizzle also keeps `drizzle.__drizzle_migrations`. Don't edit it by hand.

## Schema change or not?

| Change | Migration? |
|---|---|
| New field in `SiteSettings` | **No.** Add it to the type, `defaultSettings`, `saveSettings` and the settings form. |
| New column, table, index, enum value, or type change | **Yes.** See [migrations.md](migrations.md). |
