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
2. Call or message the customer (phone, WhatsApp and Viber links are on the right). Confirm items, address and how they'll pay: customers don't choose a payment method at checkout. If they added a nearest landmark or pinned their location at checkout, it's under the address (**Open location in Google Maps**).
3. Set the status as it moves: **Confirmed → Paid → Shipped → Delivered**. The customer's order page follows it straight away.
4. To tell the customer something, write it in **Update for the customer** (e.g. "Sent with Pathao, arrives Friday" or a courier tracking number); it shows on their order page under the status. The **private note** is for you only: payment references, call notes.
5. If it falls through, set **Cancelled**: the items go back into stock automatically.

Prefer Cancelled over Delete so you keep a record.

**Customers tracking their order.** Their confirmation page and email link to their order page. If they lose it, **Track order** (in the footer, at `/track`) finds it from the order number (e.g. F1N-1027) and the phone number they ordered with; both must match. Orders placed on the same phone or computer are also listed there.

**Order emails.** When SMTP is set up (see [docs/deploy/env-vars.md](deploy/env-vars.md)), every new order is emailed to the store with the customer's details, the map pin and a button to open it here. Reply to the email to reach the customer, if they gave an email address. Customers who gave one also get an "order received" email with their items, total, delivery address and a link to their order page; their replies come to the store's inbox.

## Adding or editing a product

**Products → New product**

For existing items, select **Edit** in the product row on the Products list.

| Field | Tip |
|---|---|
| Name | Be specific; it's the page title on Google. "McLaren MCL39 Lando Norris 1:43 with display case" beats "Norris car". |
| URL slug | Filled from the name. Don't change it once the product is live. |
| Description | What it is, scale, what's in the box. A blank line starts a new paragraph. |
| Brand, Scale, Badge | Badge shows on the card: New, Bestseller, Pre-order (Pre-order also tells Google it's a pre-order). |
| Images | **Upload** one or several images at once, or add images from the library. The first is the main photo; use ← → to reorder or remove images. White-background photos look best. Max 4 MB each. |
| Price | In rupees. Variants can override it. Leave empty and tick "No price"; the product page shows a direct **DM us on Instagram** link for pricing. Product cards show "Ask on Instagram". |
| Variants | One row with no label for a simple product. For sizes or options, add a row per option with a label (Adult, Kids, S, M, L). |
| Stock | Per variant. **Empty = not tracked** (always available). **0 = sold out.** Use **Mark all sold out** to set every variant to 0. Stock goes down automatically when someone orders. |
| Team / Driver / Category | Puts the product on those pages and in the menus. |
| Status | **Draft** and **Archived** are hidden; **Active** publishes. Sold out is inventory, not a separate visibility status: keep it Active and set all variants to 0. |
| SEO title / description | Optional. Good defaults are generated. |

Quick stock change: on the **Products** list, type the new number next to a variant and click **set**.

## Teams, drivers, categories

- **Teams**: use **Edit team** in the Teams list or a driver's team cell to change the name/spelling, colour, intro text, or logo.
- **Drivers**: use **Edit driver** in the Drivers list to change the name, number, team, intro, or portrait. Driver portraits appear on the home page and public Drivers page. On a driver's edit page, use **Edit team: [name]** to update its associated team's spelling, colour, or logo.
- **Categories**: tick **List under Accessories** for caps, keychains etc.; tick **Tab on "New in"** to add a filter tab on the home page.
- Empty accessory categories stay editable in admin but are hidden from the home page and navigation. The home page shows “Coming soon” until an accessory has active products.
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
| Delivery & payment | Areas and fees (`Jhapa | 100` per line; customers pick their district at checkout and get the first area that names it, then `Kathmandu Valley` for the valley's three districts, then one naming their province; the last line covers everywhere else), towns you deliver to (one per line, listed on the home page and given to search engines), free-delivery threshold, payment methods (`eSewa | instructions` per line) |
| Pages | Delivery, Returns, Contact text, the footer description (under the logo) and the footer disclaimer |
| Search engines | Home page title, default description, and search phrases (one per line, e.g. `F1 store Kathmandu`) |

Payment methods aren't offered at checkout any more; the list tells search engines what you accept. Keep account numbers out of it and send them to the customer directly.

## Tips

- **Ctrl+S / ⌘S** saves any editor. You're warned before leaving a page with unsaved changes.
- Fields left empty simply hide that part of the site.
- Changing the admin password or path: update the environment variables at your host and redeploy.
