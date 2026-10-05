# Checkout and orders

Guest checkout: no customer accounts. Payment is not taken online; the customer picks COD, eSewa, Khalti or bank transfer and the store confirms by phone.

## The bag (browser)

`components/bag.tsx` keeps `[{ variantId, qty, slug, name, variantLabel, price, image }]` in `localStorage` (`f1sn-bag-v1`), synced across tabs. The snapshot is only for display; nothing in it is trusted.

## Pricing (server)

`src/lib/pricing.ts` is pure and unit-tested:

- `normalizeBag`: merges duplicate variants, floors quantities, caps each line at 10 and the bag at 30 lines.
- `quote(bag, variants, zone, freeOver)`: prices each line from **database rows** (variant price, else product price) and returns `problems` for anything inactive, deleted, unpriced or short on stock.
- `deliveryFeeFor`: the chosen area's fee, free over `freeDeliveryOver`, nothing for an empty bag.

`/checkout` calls the `quoteBag` action whenever the bag or delivery area changes, so the totals shown are the server's.

## Placing an order

`submitOrder` validates the form with zod (name, Nepali phone `98XXXXXXXX` / `+977…`, optional email, city, address, note) and a honeypot field, then `placeOrder` runs **one transaction**:

1. Load the variants fresh and re-run `quote`. Any problem → `CheckoutError` with per-item reasons, shown next to the items.
2. For each tracked variant: `UPDATE … SET stock = stock - qty WHERE id = ? AND stock >= qty`. No row updated → someone else got there first → roll back.
3. Insert the order (random 16-char `token`) and items with **snapshots** of name, variant label and unit price.

Then `updateTag("products")`, clear the bag, and redirect to `/order/<token>`.

Two customers racing for the last unit can't both get it (covered by `test/db.integration.test.ts`).

## Statuses

`new → confirmed → paid → shipped → delivered`, or `cancelled`.

| Change | Stock |
|---|---|
| any → `cancelled` | tracked stock returned |
| `cancelled` → any other | taken again; fails if there isn't enough |
| delete an order that hadn't shipped | cancelled first (stock returned), then deleted |

The admin shows a "New orders" badge in the nav and on the dashboard.

## Privacy

- The order page is reached only by its token, is `noindex`, and shows items and totals but not the address or phone.
- Customer details are visible only in the admin.
- Deleting a product never deletes order history (`order_items` keep snapshots; FKs set null).
