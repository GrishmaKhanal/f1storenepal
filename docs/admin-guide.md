# Admin guide

For whoever runs the store day to day. Open `https://<your-site><ADMIN_PATH>` (the secret path from your env vars) and sign in. Keep the address private; `/admin` always shows "not found".

Everything you save is **live on the site straight away**. No redeploy, no waiting.

## Dashboard

- **New orders**: orders waiting for you to call and confirm.
- **Orders this month**: count and total, cancelled ones excluded.
- **Active products**: what's on the site, how many drafts, how many units are in stock.
- **Out of stock / running low**: anything at 0, or at or below your "Low stock warning" number (Site content).
- **Refresh public pages**: only needed if someone changed the database outside the admin.

## Handling an order

1. **Orders → New**. Open the order.
2. Call or message the customer (phone, WhatsApp and Viber links are on the right). Confirm items, address and payment.
3. Set the status as it moves: **Confirmed → Paid → Shipped → Delivered**. Use the private note for tracking numbers or payment references; customers never see it.
4. If it falls through, set **Cancelled**: the items go back into stock automatically.

Prefer Cancelled over Delete so you keep a record.

## Adding a product

**Products → New product**

| Field | Tip |
|---|---|
| Name | Be specific; it's the page title on Google. "McLaren MCL39 Lando Norris 1:43 with display case" beats "Norris car". |
| URL slug | Filled from the name. Don't change it once the product is live. |
| Description | What it is, scale, what's in the box. A blank line starts a new paragraph. |
| Brand, Scale, Badge | Badge shows on the card: New, Bestseller, Pre-order (Pre-order also tells Google it's a pre-order). |
| Images | **Upload** (several at once) or **From library**. The first is the main photo; use ← → to reorder. White-background photos look best. Max 4 MB each. |
| Price | In rupees. Variants can override it. Leave empty and tick "No price" to show "Ask on Instagram" instead. |
| Variants | One row with no label for a simple product. For sizes or options, add a row per option with a label (Adult, Kids, S, M, L). |
| Stock | Per variant. **Empty = not tracked** (always available). **0 = sold out.** It goes down automatically when someone orders. |
| Team / Driver / Category | Puts the product on those pages and in the menus. |
| Status | **Draft** while you're preparing it, **Active** to publish, **Archived** to hide it without deleting. |
| SEO title / description | Optional. Good defaults are generated. |

Quick stock change: on the **Products** list, type the new number next to a variant and click **set**.

## Teams, drivers, categories

- **Teams**: name, colour (used for stripes and dots), intro text, optional logo.
- **Drivers**: number, team, intro, optional portrait. Tick **Feature on the home page** for the driver cards. Only upload photos you have the rights to.
- **Categories**: tick **List under Accessories** for caps, keychains etc.; tick **Tab on "New in"** to add a filter tab on the home page.
- Unticking **Show on site** hides one without deleting it. Product counts update by themselves.

## Media

Every uploaded image. Edit the **alt text** (a short description of the image; it helps Google and screen readers). An image that's still used somewhere can't be deleted.

## Site content

| Section | Controls |
|---|---|
| Store | Name, tagline (also the slogan search engines see), location (optional public address for the footer, Contact and search engines; empty by default), phone, WhatsApp, email |
| Instagram | Link and handle. Empty hides every Instagram button. |
| Announcement strip | The black bar at the top, one message per line |
| Home page hero | Style (dark/light), headline (`*stars*` make words red), text, the product for "Add to bag", second button, photo, big background number |
| How ordering works | The numbered steps (`Title | text` per line) |
| Delivery & payment | Areas and fees (`Jhapa | 100` per line), towns you deliver to (one per line, listed on the home page and given to search engines), free-delivery threshold, payment methods (`eSewa | instructions` per line) |
| Pages | Delivery, Returns, Contact text, the footer description (under the logo) and the footer disclaimer |
| Search engines | Home page title, default description, and search phrases (one per line, e.g. `F1 store Kathmandu`) |

Payment instructions are shown publicly at checkout. Don't put account numbers there; send them to the customer directly.

## Tips

- **Ctrl+S / ⌘S** saves any editor. You're warned before leaving a page with unsaved changes.
- Fields left empty simply hide that part of the site.
- Changing the admin password or path: update the environment variables at your host and redeploy.
