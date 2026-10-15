# Catalogue SEO copy: draft for review

Drafted 15 Oct 2026. **Nothing has been written to the database.** The values below are in [`content.json`](content.json). [`scripts/apply-seo-content.ts`](../../scripts/apply-seo-content.ts) writes them once you're happy with them.

What's covered (81 fields):

- 6 Bburago cars: description, SEO title, SEO description
- 3 posters: SEO title and SEO description, plus a tidied description
- 5 teams, 6 drivers and 2 categories: description, SEO title, SEO description
- 15 images with placeholder alt text ("CL", "LH2", "01"…)

Every fact comes from the database, from the product photos (viewed on the live site), or from a source listed under [Facts and sources](#facts-and-sources). The copy makes no claims about licensing, materials, display cases, stock, reviews or guarantees.

## Please confirm

1. **Display case.** No copy mentions a case, because what's included isn't recorded. The photos are inconsistent:
   - A clear cover appears in photos for Hamilton (image LH3), Norris, Verstappen and Alonso.
   - Leclerc's photos and the Antonelli photos I checked show the car, its base or its box, but no cover.
   - Both Ferrari boxes say "Formula Racing", age 3+. The others say "Race", age 14+.

   If every model ships with a clear case, tell me and I'll add one sentence to each product. If only some do, say which ones.
2. **Car numbers in two product names.** The models are 2025 cars, but two names use the drivers' 2026 numbers:
   - **#1 Lando Norris (McLaren MCL39).** In 2025 Norris raced the MCL39 as **#4**. He took #1 for 2026 after winning the 2025 title.
   - **#3 Max Verstappen (Red Bull RB21).** In 2025 Verstappen raced the RB21 as **#1**, which is visible on the nose in the product photo. #3 is his 2026 number.

   Suggested names (the slugs have no numbers, so URLs don't change):
   - `Bburago F1 Car 1:43 #4 Lando Norris — McLaren`
   - `Bburago F1 Car 1:43 #1 Max Verstappen — Red Bull Racing`
   - Or drop the number and name the car: `Bburago F1 Car 1:43 Lando Norris — McLaren MCL39`

   The drafted copy avoids both numbers, so it reads correctly with either name. The drivers' own numbers (Norris 1, Verstappen 3) are right for 2026 and can stay. Draft products weren't reviewed. Isack Hadjar (#6, Red Bull) may need the same check before he goes live.
3. **Norris model edition.** In the Norris photos, the box reads "McLaren MCL39 Australian GP 2025" and the base reads "McLaren MCL39 · Australian GP · Lando Norris". Norris won that race. If that's the version you stock, it's a good selling line ("the car he won the 2025 season opener with"), so confirm before I add it.
4. **Retail box.** The photos show every car with its Bburago box. Does each one arrive boxed? The copy doesn't say so yet.
5. **Rename the "Model cars" category.** Shoppers search "f1 diecast car nepal" and "bburago nepal". Rename the category in the admin to **"F1 diecast cars"** (or "Diecast cars"), which also changes its h1 and menu label. This is a name change, not an SEO field, so it isn't in `content.json`. The slug `model-cars` stays.
6. **Price in the copy.** "Rs 4,050" appears in the 6 product SEO descriptions and in both model-cars fields. If the price changes, update those too. The product pages already show the live price on their own.
7. **Posters.** All three have no price, so the site shows "Ask on Instagram". Their copy says "DM us on Instagram to order", which needs changing once they have prices. For the F1: The Movie poster, the copy keeps the supplier's "rolled": confirm it reaches customers rolled, not folded.
8. **Duplicate poster image.** On the Hamilton poster set, image 02 (500 px) is a smaller copy of image 01 (1500 px). Consider removing it in the admin. It has alt text here in case you keep it.
9. **Alonso mini helmet.** The starter content in `src/content/seed.ts` listed an Alonso model "with helmet and display case". None of the current photos show a helmet, so the copy doesn't mention one. Ignore this unless your model does include one.

## Applying it and making it live

1. **Edit** `docs/seo/content.json` if needed. Delete any entry or field you don't want written. Keys starting with `_` are notes. `_expect` is a guard: if the row's name or slug doesn't match, that row is skipped.
2. **Dry run** from the repo root (writes nothing, prints current → proposed for each field):
   ```
   npx tsx scripts/apply-seo-content.ts
   ```
   `DATABASE_URL` must point to the **live** database. The script loads `.env`, but a `DATABASE_URL` already set in the environment takes precedence, e.g. `node --env-file=<your production env file> --import tsx scripts/apply-seo-content.ts`. Check that the "−" lines match what the live site shows now (empty descriptions, alt text like `CL`). That's how you know it's the right database. The script never prints the connection string.
3. **Apply:**
   ```
   npx tsx scripts/apply-seo-content.ts --apply
   ```
   All changes go in one transaction, so either everything is written or nothing is. The script only touches the listed fields, and it bumps `updated_at` on products, teams, drivers and categories so `sitemap.xml` shows a fresh `lastmod`. If Neon drops the connection, the script retries, and running it again is safe.
4. **Make it live: press "Refresh public pages".** Public pages read the catalogue through `unstable_cache` with tags `settings`, `catalog` and `products` (`TAGS` in `src/lib/data.ts`) and `revalidate: false`, so they never expire on a timer. Tags only expire through `updateTag` calls in the admin's server actions (`src/app/admin/actions.ts`) and when an order is placed (`src/app/actions/checkout.ts`, `products` only). A script write expires nothing, so the site keeps serving the old copy. After `--apply`:
   - Log in to the admin (your `ADMIN_PATH` URL), open the **Dashboard**, and click **"Refresh public pages"** at the bottom. This runs `refreshPublicPages()`, which expires all three tags. Each page rebuilds on its next visit.
   - No redeploy is needed. A redeploy also refreshes the pages (see `docs/architecture/caching.md`), but it takes longer.
   - Saving a single product in the admin isn't enough: it expires `products` and `settings` but not `catalog`, and team, driver and category pages read from `catalog`.
5. **Check and re-crawl.** View the source of one product page and confirm the new `<title>` and `<meta name="description">`. Then use Search Console → URL Inspection → Request indexing for the 6 car pages and `/accessories/model-cars`. Google updates snippets over days to weeks, and it may rewrite them.

## Notes on the copy

- **Title suffix.** Every page title gets ` | Lights Out Nepal` appended (`src/app/layout.tsx` title template), so SEO titles don't repeat the store name. That's also why the model-cars title uses a colon instead of a second "|". Product titles are 56–60 characters, so Google may cut the suffix. The keywords come first.
- **"Price in Nepal".** Product titles use this phrasing because Nepali shoppers commonly search "<product> price in Nepal".
- **Delivery and payment lines** match the store's own settings: cash on delivery, eSewa, Khalti and bank transfer, plus "we call or message to confirm every order". The second paragraph is worded differently on each product so the six pages aren't near-duplicates.
- **Only stocked items are mentioned.** The copy doesn't mention caps, keychains or any category without active products.
- **Teams and drivers** each get one fact that won't go stale, such as a past title or a debut year, instead of "currently drives for". Team and driver descriptions name the products in stock today, so update them when the range changes.
- **Images.** Alt text describes what each photo actually shows, checked by viewing it. I found **15** placeholder alts on active products, not 16. The other 28 (e.g. "Charles Leclerc SF 25 02") are readable and were left alone. They could be standardised later ("Bburago 1:43 … diecast, photo 2").
- **Poster descriptions.** The Movie and Hamilton descriptions were copied supplier listing titles ("Premium…", "Wall Art For Bedroom, Living room, Office"), so they're rewritten using the same facts. The Verstappen poster keeps its sentence and gains one line describing the artwork.

## Products: Bburago 1:43 cars

### Bburago F1 Car 1:43 #16 Charles Leclerc — Ferrari (products #2)

`/products/bburago-f1-1-43-charles-leclerc`

**Description** (97 words)

- Current: *(empty)*
- Proposed:

> Charles Leclerc's 2025 Ferrari SF-25, scaled down to 1:43 by Bburago. The diecast model wears Ferrari red with his #16 and is small enough to sit in the palm of your hand, so it fits easily on a desk, a bookshelf or beside the TV for race weekends.
>
> Leclerc joined Ferrari in 2019 and won his home Monaco Grand Prix with the team in 2024. Add Lewis Hamilton's SF-25 and you have both 2025 Ferrari cars side by side. We deliver anywhere in Nepal, and you can pay by cash on delivery, eSewa, Khalti or bank transfer.

**SEO title** (60 chars; shows as "… | Lights Out Nepal")

- Current: *(empty)* (page falls back to the product name)
- Proposed: `Bburago F1 1:43 Charles Leclerc Ferrari SF-25 Price in Nepal`

**SEO description** (151 chars)

- Current: *(empty)* (page falls back to "<description> Rs <price>. Delivered across Nepal.", so the cars currently show only "Rs 4,050. Delivered across Nepal.")
- Proposed: `Bburago 1:43 diecast of Charles Leclerc's 2025 Ferrari SF-25 (#16). Rs 4,050, delivered across Nepal. Cash on delivery, eSewa, Khalti or bank transfer.`

### Bburago F1 Car 1:43 #44 Lewis Hamilton — Ferrari (products #3)

`/products/bburago-f1-1-43-lewis-hamilton`

**Description** (95 words)

- Current: *(empty)*
- Proposed:

> The Ferrari SF-25 from Lewis Hamilton's first season in red, made by Bburago in 1:43 scale. The diecast carries his #44 in Ferrari's 2025 colours and is palm-sized: a neat piece for a desk or shelf, and an easy gift for any Hamilton or Ferrari fan.
>
> Hamilton won seven Formula 1 world titles before moving from Mercedes to Ferrari in 2025. Pair this model with Charles Leclerc's SF-25 for Ferrari's full 2025 line-up. Delivery covers all of Nepal, from the Kathmandu Valley to Pokhara and Biratnagar, with cash on delivery, eSewa, Khalti or bank transfer.

**SEO title** (59 chars; shows as "… | Lights Out Nepal")

- Current: *(empty)* (page falls back to the product name)
- Proposed: `Bburago F1 1:43 Lewis Hamilton Ferrari SF-25 Price in Nepal`

**SEO description** (152 chars)

- Current: *(empty)* (page falls back to "<description> Rs <price>. Delivered across Nepal.", so the cars currently show only "Rs 4,050. Delivered across Nepal.")
- Proposed: `Lewis Hamilton's 2025 Ferrari SF-25 (#44) as a Bburago 1:43 diecast. Rs 4,050, delivered across Nepal. Cash on delivery, eSewa, Khalti or bank transfer.`

### Bburago F1 Car 1:43 #1 Lando Norris — McLaren (products #4)

`/products/bburago-f1-1-43-lando-norris`

**Description** (97 words)

- Current: *(empty)*
- Proposed:

> Bburago's 1:43 diecast of the McLaren MCL39, the car Lando Norris drove in 2025, the season he won his first Formula 1 world title. The papaya and black livery is reproduced on a model that fits in your palm, ready for a desk or display shelf.
>
> Norris made his F1 debut with McLaren in 2019 and sealed the 2025 championship by two points at the final race in Abu Dhabi. A good pick for McLaren fans or anyone who followed that title fight. We ship across Nepal and accept cash on delivery, eSewa, Khalti or bank transfer.

**SEO title** (57 chars; shows as "… | Lights Out Nepal")

- Current: *(empty)* (page falls back to the product name)
- Proposed: `Bburago F1 1:43 Lando Norris McLaren MCL39 Price in Nepal`

**SEO description** (149 chars)

- Current: *(empty)* (page falls back to "<description> Rs <price>. Delivered across Nepal.", so the cars currently show only "Rs 4,050. Delivered across Nepal.")
- Proposed: `Bburago 1:43 McLaren MCL39 from Lando Norris's 2025 title season. Rs 4,050, delivered across Nepal. Cash on delivery, eSewa, Khalti or bank transfer.`

### Bburago F1 Car 1:43 #3 Max Verstappen — Red Bull Racing (products #6)

`/products/bburago-f1-1-43-max-verstappen`

**Description** (98 words)

- Current: *(empty)*
- Proposed:

> A 1:43 Bburago diecast of the Red Bull RB21 that Max Verstappen raced in the 2025 Formula 1 season. The dark blue Red Bull livery with its red and yellow details is reproduced on a model small enough to hold in one hand.
>
> Verstappen won four consecutive world championships with Red Bull from 2021 to 2024, and in the RB21 he finished just two points short of a fifth. Order online for delivery anywhere in Nepal and pay by cash on delivery, eSewa, Khalti or bank transfer. We call or message to confirm every order before it ships.

**SEO title** (59 chars; shows as "… | Lights Out Nepal")

- Current: *(empty)* (page falls back to the product name)
- Proposed: `Bburago F1 1:43 Max Verstappen Red Bull RB21 Price in Nepal`

**SEO description** (155 chars)

- Current: *(empty)* (page falls back to "<description> Rs <price>. Delivered across Nepal.", so the cars currently show only "Rs 4,050. Delivered across Nepal.")
- Proposed: `Max Verstappen's 2025 Red Bull RB21 as a Bburago 1:43 diecast car. Rs 4,050, delivered anywhere in Nepal. Cash on delivery, eSewa, Khalti or bank transfer.`

### Bburago F1 Car 1:43 #12 Kimi Antonelli — Mercedes (products #9)

`/products/bburago-f1-1-43-kimi-antonelli`

**Description** (88 words)

- Current: *(empty)*
- Proposed:

> Bburago's 1:43 diecast of the Mercedes W16 from Kimi Antonelli's rookie Formula 1 season in 2025. The model carries his #12 on Mercedes' black livery with teal details, and it is small enough to sit in your palm.
>
> Antonelli, from Italy, made his race debut for Mercedes at the 2025 Australian Grand Prix aged 18, in the seat Lewis Hamilton left for Ferrari. A fitting start to a collection of F1's newest generation. Cash on delivery, eSewa, Khalti and bank transfer are all accepted, with delivery across Nepal.

**SEO title** (58 chars; shows as "… | Lights Out Nepal")

- Current: *(empty)* (page falls back to the product name)
- Proposed: `Bburago F1 1:43 Kimi Antonelli Mercedes W16 Price in Nepal`

**SEO description** (153 chars)

- Current: *(empty)* (page falls back to "<description> Rs <price>. Delivered across Nepal.", so the cars currently show only "Rs 4,050. Delivered across Nepal.")
- Proposed: `Bburago 1:43 diecast of Kimi Antonelli's 2025 Mercedes W16 (#12), his rookie F1 car. Rs 4,050, delivered across Nepal. Cash on delivery, eSewa or Khalti.`

### Bburago F1 Car 1:43 #14 Fernando Alonso — Aston Martin (products #10)

`/products/bburago-f1-1-43-fernando-alonso`

**Description** (88 words)

- Current: *(empty)*
- Proposed:

> The Aston Martin AMR25 that Fernando Alonso raced in 2025, made by Bburago in 1:43 scale. It wears Aston Martin's racing green with lime details and his #14, on a model that fits in the palm of your hand.
>
> Alonso won back-to-back world titles with Renault in 2005 and 2006 and joined Aston Martin in 2023, so this car is one chapter of a very long F1 career. We deliver to every part of Nepal, and you can pay by cash on delivery, eSewa, Khalti or bank transfer.

**SEO title** (56 chars; shows as "… | Lights Out Nepal")

- Current: *(empty)* (page falls back to the product name)
- Proposed: `Bburago F1 1:43 Alonso Aston Martin AMR25 Price in Nepal`

**SEO description** (149 chars)

- Current: *(empty)* (page falls back to "<description> Rs <price>. Delivered across Nepal.", so the cars currently show only "Rs 4,050. Delivered across Nepal.")
- Proposed: `Fernando Alonso's 2025 Aston Martin AMR25 (#14) as a Bburago 1:43 diecast model. Rs 4,050, delivered across Nepal. Cash on delivery, eSewa or Khalti.`

## Posters

### F1: The Movie Wall Poster (products #28)

`/products/f1-the-movie-wall-poster`

**Description** (46 words)

- Current:

> Draftt F1 - The Movie Premium Wall Poster Paper Print (19 inch X 13 inch, Rolled)
> Medium-size F1: The Movie paper wall poster with a matte finish.

- Proposed:

> F1: The Movie wall poster by Draftt, printed on paper with a matte finish. Medium size, 19 x 13 inches, supplied rolled.
>
> The artwork shows the APXGP number 7 car from above and its driver walking with his helmet, from the 2025 film starring Brad Pitt.

**SEO title** (47 chars; shows as "… | Lights Out Nepal")

- Current: *(empty)* (page falls back to the product name)
- Proposed: `F1 The Movie Wall Poster in Nepal, 19 x 13 inch`

**SEO description** (154 chars)

- Current: *(empty)* (page falls back to the description plus "Delivered across Nepal." (no price, since posters have none))
- Proposed: `F1: The Movie wall poster by Draftt: matte paper print, 19 x 13 inches, from the 2025 Brad Pitt film. Delivered across Nepal; DM us on Instagram to order.`

### Max Verstappen Red Bull F1 Poster (products #33)

`/products/max-verstappen-red-bull-f1-poster`

**Description** (43 words)

- Current:

> Small paper poster featuring Max Verstappen and Red Bull Formula One artwork.

- Proposed:

> Small paper poster featuring Max Verstappen and Red Bull Formula One artwork.
>
> The illustrated design shows Verstappen, his helmet and a Red Bull car carrying number 33, the number he raced with from his 2015 debut until his first world title in 2021.

**SEO title** (42 chars; shows as "… | Lights Out Nepal")

- Current: *(empty)* (page falls back to the product name)
- Proposed: `Max Verstappen Red Bull F1 Poster in Nepal`

**SEO description** (151 chars)

- Current: *(empty)* (page falls back to the description plus "Delivered across Nepal." (no price, since posters have none))
- Proposed: `Small Max Verstappen Red Bull F1 paper poster with illustrated #33 artwork. Delivered across Nepal; message us on Instagram for the price and to order.`

### Lewis Hamilton F1 Poster Set — 3 Pieces (products #38)

`/products/lewis-hamilton-f1-poster-set-3`

**Description** (55 words)

- Current:

> Live Mad Live Crazy Pack of 3 - Popular F1 Driver Lewis Hamilton Wall Posters 8.3X11.7 inch (A4 Size) Wall Art For Bedroom, Living room, Office

- Proposed:

> A pack of three Lewis Hamilton wall posters by LiveMad Live Crazy, each A4 size (8.3 x 11.7 inches), for a bedroom, living room or office wall.
>
> The three designs, as pictured: a teal Mercedes poster with Hamilton's 44, a portrait of Hamilton with his Mercedes car, and a white 44 print with the car.

**SEO title** (47 chars; shows as "… | Lights Out Nepal")

- Current: *(empty)* (page falls back to the product name)
- Proposed: `Lewis Hamilton F1 Poster Set of 3 (A4) in Nepal`

**SEO description** (146 chars)

- Current: *(empty)* (page falls back to the description plus "Delivered across Nepal." (no price, since posters have none))
- Proposed: `Set of three A4 Lewis Hamilton wall posters with Mercedes #44 designs, by LiveMad Live Crazy. Delivered across Nepal; DM us on Instagram to order.`

## Teams

### Ferrari (teams #1)

`/teams/ferrari`

**Description** (62 words)

- Current: *(empty)*
- Proposed:

> Ferrari F1 merch in Nepal, starting with Bburago 1:43 diecast models of the 2025 Ferrari SF-25 as driven by Charles Leclerc (#16) and Lewis Hamilton (#44). We deliver anywhere in Nepal, with cash on delivery, eSewa, Khalti or bank transfer. Scuderia Ferrari is the only team to have raced in every Formula 1 World Championship season since the championship began in 1950.

**SEO title** (52 chars; shows as "… | Lights Out Nepal")

- Current: *(empty)* (page falls back to "<Team> F1 merchandise and diecast cars")
- Proposed: `Ferrari F1 Diecast Cars in Nepal: Leclerc & Hamilton`

**SEO description** (152 chars)

- Current: *(empty)* (page falls back to a generic line about diecast cars, caps and gifts)
- Proposed: `Ferrari F1 merch in Nepal: Bburago 1:43 SF-25 diecast cars of Charles Leclerc and Lewis Hamilton. Delivered nationwide; cash on delivery, eSewa, Khalti.`

### McLaren (teams #2)

`/teams/mclaren`

**Description** (62 words)

- Current: *(empty)*
- Proposed:

> McLaren F1 merch in Nepal, including a Bburago 1:43 diecast of the MCL39 that Lando Norris drove to the 2025 world title. Delivery covers all of Nepal, and you can pay by cash on delivery, eSewa, Khalti or bank transfer. Founded by New Zealand racer Bruce McLaren in 1963, the team made its Formula 1 debut at the 1966 Monaco Grand Prix.

**SEO title** (52 chars; shows as "… | Lights Out Nepal")

- Current: *(empty)* (page falls back to "<Team> F1 merchandise and diecast cars")
- Proposed: `McLaren F1 Diecast Cars in Nepal: Lando Norris MCL39`

**SEO description** (149 chars)

- Current: *(empty)* (page falls back to a generic line about diecast cars, caps and gifts)
- Proposed: `McLaren F1 merch in Nepal: Bburago 1:43 MCL39 diecast from Lando Norris's 2025 title season. Delivered nationwide; cash on delivery, eSewa or Khalti.`

### Red Bull Racing (teams #3)

`/teams/red-bull-racing`

**Description** (51 words)

- Current: *(empty)*
- Proposed:

> Red Bull Racing merch in Nepal: a Bburago 1:43 diecast of Max Verstappen's 2025 RB21 and an illustrated Max Verstappen wall poster. We deliver across Nepal; pay by cash on delivery, eSewa, Khalti or bank transfer. Based in Milton Keynes, England, Red Bull Racing made its Formula 1 debut in 2005.

**SEO title** (48 chars; shows as "… | Lights Out Nepal")

- Current: *(empty)* (page falls back to "<Team> F1 merchandise and diecast cars")
- Proposed: `Red Bull Racing F1 Diecast Car & Poster in Nepal`

**SEO description** (151 chars)

- Current: *(empty)* (page falls back to a generic line about diecast cars, caps and gifts)
- Proposed: `Red Bull Racing merch in Nepal: Bburago 1:43 RB21 diecast of Max Verstappen's car and a Verstappen wall poster. Delivered nationwide; cash on delivery.`

### Mercedes (teams #4)

`/teams/mercedes`

**Description** (56 words)

- Current: *(empty)*
- Proposed:

> Mercedes F1 merch in Nepal: a Bburago 1:43 diecast of Kimi Antonelli's 2025 Mercedes W16 and a set of three A4 Lewis Hamilton posters with Mercedes #44 designs. Orders are delivered anywhere in Nepal, paid by cash on delivery, eSewa, Khalti or bank transfer. Mercedes won a record eight consecutive Constructors' Championships, from 2014 to 2021.

**SEO title** (42 chars; shows as "… | Lights Out Nepal")

- Current: *(empty)* (page falls back to "<Team> F1 merchandise and diecast cars")
- Proposed: `Mercedes F1 Diecast Car & Posters in Nepal`

**SEO description** (152 chars)

- Current: *(empty)* (page falls back to a generic line about diecast cars, caps and gifts)
- Proposed: `Mercedes F1 merch in Nepal: Bburago 1:43 W16 diecast of Kimi Antonelli's car and a Lewis Hamilton A4 poster set. Delivered nationwide; cash on delivery.`

### Aston Martin (teams #5)

`/teams/aston-martin`

**Description** (56 words)

- Current: *(empty)*
- Proposed:

> Aston Martin F1 merch in Nepal, led by a Bburago 1:43 diecast of the AMR25 that Fernando Alonso raced in 2025. We deliver to every part of Nepal and accept cash on delivery, eSewa, Khalti and bank transfer. The Aston Martin name returned to Formula 1 in 2021, with the team based at Silverstone in England.

**SEO title** (50 chars; shows as "… | Lights Out Nepal")

- Current: *(empty)* (page falls back to "<Team> F1 merchandise and diecast cars")
- Proposed: `Aston Martin F1 Diecast Car in Nepal: Alonso AMR25`

**SEO description** (142 chars)

- Current: *(empty)* (page falls back to a generic line about diecast cars, caps and gifts)
- Proposed: `Aston Martin F1 merch in Nepal: Bburago 1:43 diecast of Fernando Alonso's 2025 AMR25. Delivered nationwide; cash on delivery, eSewa or Khalti.`

## Drivers

### Max Verstappen (drivers #1)

`/drivers/max-verstappen`

**Description** (53 words)

- Current: *(empty)*
- Proposed:

> Max Verstappen merch in Nepal: a Bburago 1:43 diecast of his 2025 Red Bull RB21 and an illustrated Red Bull wall poster. We deliver anywhere in Nepal, with cash on delivery, eSewa, Khalti or bank transfer. The Dutch driver won four consecutive Formula 1 world championships with Red Bull, from 2021 to 2024.

**SEO title** (44 chars; shows as "… | Lights Out Nepal")

- Current: *(empty)* (page falls back to a generated title)
- Proposed: `Max Verstappen Diecast Car & Poster in Nepal`

**SEO description** (154 chars)

- Current: *(empty)* (page falls back to a generic generated line)
- Proposed: `Max Verstappen merch in Nepal: Bburago 1:43 Red Bull RB21 diecast and an illustrated wall poster. Delivered nationwide; cash on delivery, eSewa or Khalti.`

### Charles Leclerc (drivers #3)

`/drivers/charles-leclerc`

**Description** (50 words)

- Current: *(empty)*
- Proposed:

> Charles Leclerc merch in Nepal, starting with a Bburago 1:43 diecast of his 2025 Ferrari SF-25 in #16. Delivery covers all of Nepal, and we accept cash on delivery, eSewa, Khalti and bank transfer. Leclerc, from Monaco, joined Ferrari in 2019 and won his home Monaco Grand Prix in 2024.

**SEO title** (44 chars; shows as "… | Lights Out Nepal")

- Current: *(empty)* (page falls back to a generated title)
- Proposed: `Charles Leclerc Ferrari Diecast Car in Nepal`

**SEO description** (142 chars)

- Current: *(empty)* (page falls back to a generic generated line)
- Proposed: `Charles Leclerc merch in Nepal: Bburago 1:43 diecast of his 2025 Ferrari SF-25 (#16). Delivered nationwide; cash on delivery, eSewa or Khalti.`

### Lewis Hamilton (drivers #4)

`/drivers/lewis-hamilton`

**Description** (57 words)

- Current: *(empty)*
- Proposed:

> Lewis Hamilton merch in Nepal: a Bburago 1:43 diecast of his 2025 Ferrari SF-25 and a set of three A4 wall posters from his Mercedes years. We deliver across Nepal; pay by cash on delivery, eSewa, Khalti or bank transfer. The British driver won seven Formula 1 world titles before moving from Mercedes to Ferrari in 2025.

**SEO title** (45 chars; shows as "… | Lights Out Nepal")

- Current: *(empty)* (page falls back to a generated title)
- Proposed: `Lewis Hamilton Diecast Car & Posters in Nepal`

**SEO description** (153 chars)

- Current: *(empty)* (page falls back to a generic generated line)
- Proposed: `Lewis Hamilton merch in Nepal: Bburago 1:43 Ferrari SF-25 diecast and an A4 poster set of three. Delivered nationwide; cash on delivery, eSewa or Khalti.`

### Lando Norris (drivers #5)

`/drivers/lando-norris`

**Description** (63 words)

- Current: *(empty)*
- Proposed:

> Lando Norris merch in Nepal, including a Bburago 1:43 diecast of the McLaren MCL39 he drove in 2025. We deliver to every part of Nepal and accept cash on delivery, eSewa, Khalti and bank transfer. The British driver made his Formula 1 debut with McLaren in 2019 and won the 2025 world championship by two points at the season finale in Abu Dhabi.

**SEO title** (41 chars; shows as "… | Lights Out Nepal")

- Current: *(empty)* (page falls back to a generated title)
- Proposed: `Lando Norris McLaren Diecast Car in Nepal`

**SEO description** (153 chars)

- Current: *(empty)* (page falls back to a generic generated line)
- Proposed: `Lando Norris merch in Nepal: Bburago 1:43 McLaren MCL39 diecast from his 2025 championship season. Delivered nationwide; cash on delivery, eSewa, Khalti.`

### Kimi Antonelli (drivers #8)

`/drivers/kimi-antonelli`

**Description** (54 words)

- Current: *(empty)*
- Proposed:

> Kimi Antonelli merch in Nepal: a Bburago 1:43 diecast of the Mercedes W16 from his 2025 rookie season, carrying his #12. Delivery covers all of Nepal, with cash on delivery, eSewa, Khalti or bank transfer. The Italian driver made his Formula 1 race debut for Mercedes at the 2025 Australian Grand Prix, aged 18.

**SEO title** (44 chars; shows as "… | Lights Out Nepal")

- Current: *(empty)* (page falls back to a generated title)
- Proposed: `Kimi Antonelli Mercedes Diecast Car in Nepal`

**SEO description** (152 chars)

- Current: *(empty)* (page falls back to a generic generated line)
- Proposed: `Kimi Antonelli merch in Nepal: Bburago 1:43 diecast of his rookie-season 2025 Mercedes W16 (#12). Delivered nationwide; cash on delivery, eSewa, Khalti.`

### Fernando Alonso (drivers #9)

`/drivers/fernando-alonso`

**Description** (56 words)

- Current: *(empty)*
- Proposed:

> Fernando Alonso merch in Nepal: a Bburago 1:43 diecast of his 2025 Aston Martin AMR25, number 14. We deliver anywhere in Nepal, and you can pay by cash on delivery, eSewa, Khalti or bank transfer. The Spanish driver won back-to-back Formula 1 world titles with Renault in 2005 and 2006 and joined Aston Martin in 2023.

**SEO title** (45 chars; shows as "… | Lights Out Nepal")

- Current: *(empty)* (page falls back to a generated title)
- Proposed: `Fernando Alonso Aston Martin Diecast in Nepal`

**SEO description** (153 chars)

- Current: *(empty)* (page falls back to a generic generated line)
- Proposed: `Fernando Alonso merch in Nepal: Bburago 1:43 diecast of his 2025 Aston Martin AMR25 (#14). Delivered nationwide; cash on delivery, eSewa, Khalti or bank.`

## Categories

### Model cars (categories #1)

`/accessories/model-cars`

**Description** (76 words)

- Current: *(empty)*
- Proposed:

> F1 diecast cars in Nepal: Bburago 1:43 scale models of 2025 Formula 1 cars, including the Ferrari SF-25, McLaren MCL39, Red Bull RB21, Mercedes W16 and Aston Martin AMR25. Each F1 diecast car is Rs 4,050 and small enough to sit in your palm, sized for a desk or shelf. We deliver anywhere in Nepal, from the Kathmandu Valley to Pokhara and Biratnagar, and you can pay by cash on delivery, eSewa, Khalti or bank transfer.

**SEO title** (45 chars; shows as "… | Lights Out Nepal")

- Current: *(empty)* (page falls back to "F1 <name>", e.g. "F1 model cars")
- Proposed: `F1 Diecast Cars in Nepal: Bburago 1:43 Models`

**SEO description** (153 chars)

- Current: *(empty)* (page falls back to "Shop Formula 1 <name> in Nepal…")
- Proposed: `Bburago 1:43 F1 diecast cars in Nepal for Rs 4,050: Ferrari, McLaren, Red Bull, Mercedes and Aston Martin. Delivered nationwide; cash on delivery, eSewa.`

### Wall Posters (categories #11)

`/accessories/wall-posters`

**Description** (56 words)

- Current:

> Formula 1 wall posters and art prints.

- Proposed:

> F1 wall posters in Nepal for a bedroom, office or fan corner: an F1: The Movie print, an illustrated Max Verstappen Red Bull poster and a set of three A4 Lewis Hamilton posters. Sizes and finishes differ by poster, so check each listing. We deliver across Nepal; message us on Instagram for prices and to order.

**SEO title** (53 chars; shows as "… | Lights Out Nepal")

- Current: *(empty)* (page falls back to "F1 <name>", e.g. "F1 model cars")
- Proposed: `F1 Wall Posters in Nepal: Verstappen, Hamilton & More`

**SEO description** (149 chars)

- Current: *(empty)* (page falls back to "Shop Formula 1 <name> in Nepal…")
- Proposed: `F1 wall posters in Nepal: F1: The Movie, Max Verstappen and a Lewis Hamilton A4 set of three. Delivered nationwide; message us on Instagram to order.`

## Image alt text

All 15 images on active products whose alt text is a placeholder.

| Media # | Product | Current | Proposed |
|---|---|---|---|
| 4 | Bburago F1 Car 1:43 #16 Charles Leclerc — Ferrari | `CL2` | Bburago 1:43 Charles Leclerc Ferrari SF-25 diecast model held in the palm of a hand, showing its size |
| 5 | Bburago F1 Car 1:43 #16 Charles Leclerc — Ferrari | `CL` | Bburago 1:43 Charles Leclerc Ferrari SF-25 diecast model on its black display base, with its Bburago Formula Racing box behind |
| 6 | Bburago F1 Car 1:43 #16 Charles Leclerc — Ferrari | `CL3` | Bburago 1:43 Charles Leclerc #16 Ferrari SF-25 diecast on a desk beside its red Bburago box |
| 13 | Bburago F1 Car 1:43 #44 Lewis Hamilton — Ferrari | `LH2` | Bburago 1:43 Lewis Hamilton #44 Ferrari SF-25 diecast model held in the palm of a hand |
| 14 | Bburago F1 Car 1:43 #44 Lewis Hamilton — Ferrari | `LH3` | Bburago 1:43 Lewis Hamilton Ferrari SF-25 diecast on its named display base with a clear cover |
| 28 | Bburago F1 Car 1:43 #1 Lando Norris — McLaren | `LN1` | Bburago 1:43 Lando Norris McLaren MCL39 diecast on its display base, with its Bburago box behind |
| 29 | Bburago F1 Car 1:43 #1 Lando Norris — McLaren | `LN2` | Bburago 1:43 Lando Norris McLaren MCL39 diecast model held in the palm of a hand |
| 25 | Bburago F1 Car 1:43 #3 Max Verstappen — Red Bull Racing | `MV2` | Bburago 1:43 Max Verstappen Red Bull RB21 diecast held in a hand, with its Bburago box behind |
| 91 | Bburago F1 Car 1:43 #12 Kimi Antonelli — Mercedes | `KA2` | Bburago 1:43 Kimi Antonelli #12 Mercedes W16 diecast held in the palm of a hand |
| 92 | Bburago F1 Car 1:43 #12 Kimi Antonelli — Mercedes | `KA1` | Bburago 1:43 Kimi Antonelli Mercedes W16 diecast in front of its Bburago F1 W16 box |
| 105 | Bburago F1 Car 1:43 #14 Fernando Alonso — Aston Martin | `FA3` | Bburago 1:43 Fernando Alonso Aston Martin AMR25 diecast on its display base, with its box and a clear cover behind |
| 106 | F1: The Movie Wall Poster | `01` | F1: The Movie wall poster showing the APXGP number 7 car from above and a driver in a white race suit carrying his helmet |
| 109 | Max Verstappen Red Bull F1 Poster | `01` | Max Verstappen Red Bull F1 poster: illustrated Verstappen, his helmet and a Red Bull car with number 33, shown on a wall |
| 107 | Lewis Hamilton F1 Poster Set — 3 Pieces | `01` | Lewis Hamilton F1 poster set of three: a teal Mercedes 44 design, a Hamilton portrait with his car and a white 44 print |
| 108 | Lewis Hamilton F1 Poster Set — 3 Pieces | `02` | Lewis Hamilton F1 poster set of three, smaller preview of the same three designs |

## Facts and sources

**From the database:** brand (Bburago), scale (1:43), price (Rs 4,050), team, driver and driver numbers. The car names (SF-25, MCL39, RB21, W16, AMR25) come from the existing image names. The poster facts (Draftt, 19 x 13 inch, matte, rolled, A4, LiveMad Live Crazy) come from the existing poster descriptions.

**From the product photos:** livery colours, #16, #44, #12 and #14 on the cars, #1 on the RB21's nose, the Norris box text, and what each poster shows.

**Checked with web search on 15 Oct 2026:**

| Claim | Source |
|---|---|
| Norris won the 2025 title by two points at the Abu Dhabi finale and uses #1 in 2026; he raced #4 before that | [formula1.com](https://www.formula1.com/en/latest/article/norris-confirms-he-will-use-car-number-1-next-season-after-claiming-maiden.ACReb1X9OOwHKUb2u8hPk), [crash.net](https://www.crash.net/f1/news/1088066/1/lando-norris-crowned-2025-f1-champion-after-tense-abu-dhabi-title-decider) |
| Verstappen: #33 from his 2015 debut, #1 from 2022 to 2025, #3 in 2026 | [formula1.com](https://www.formula1.com/en/latest/article/max-verstappen-confirms-he-will-use-car-number-3-for-2026-season.6qvN2SQwcyGYnMWhGdDpNS) |
| Verstappen, Dutch, won four consecutive titles with Red Bull, 2021–2024 | [Wikipedia](https://en.wikipedia.org/wiki/Max_Verstappen), [Al Jazeera](https://www.aljazeera.com/sports/2024/11/24/red-bulls-max-verstappen-wins-his-fourth-f1-title-at-las-vegas-grand-prix) |
| Norris won the 2025 Australian GP in the #4 MCL39 | [PlanetF1](https://www.planetf1.com/news/f1-results-2025-australian-grand-prix), [grandprix.com](https://www.grandprix.com/races/australian-gp-2025-race-notes.html) |
| Norris made his F1 debut with McLaren at the 2019 Australian GP | [formula1.com](https://www.formula1.com/en/latest/article/lando-norris-all-you-need-to-know-about-mclarens-f1-debutant.1LCJQMjHRW6KMwcWkciwUa), [RACER](https://racer.com/2019/03/19/norris-i-let-mclaren-down-in-australia) |
| Ferrari is the only team to have entered every World Championship season since 1950 | [Wikipedia](https://en.wikipedia.org/wiki/Grand_Prix_racing_history_of_Scuderia_Ferrari) |
| Mercedes won a record eight consecutive Constructors' titles, 2014–2021 | [Wikipedia](https://en.wikipedia.org/wiki/Mercedes-Benz_in_Formula_One), [mercedesamgf1.com](https://www.mercedesamgf1.com/about) |
| McLaren was founded by Bruce McLaren in 1963 and debuted at the 1966 Monaco GP | [formula1.com](https://www.formula1.com/en/latest/article.mclaren-team-honour-founder-bruce-mclaren-50-years-on-from-his-death.5dLB2TH9pyLUNmmpdvPiFV.html), [RacingNews365](https://racingnews365.com/formula-1-teams/mclaren) |
| Red Bull Racing debuted in 2005, based in Milton Keynes | [Wikipedia](https://en.wikipedia.org/wiki/Red_Bull_Racing) |
| The Aston Martin name returned to F1 in 2021; the team is based at Silverstone | [Wikipedia](https://en.wikipedia.org/wiki/Aston_Martin_in_Formula_One) |
| Antonelli, Italian, made his race debut for Mercedes at the 2025 Australian GP aged 18, in Hamilton's old seat | [RacingNews365](https://racingnews365.com/drivers/kimi-antonelli), [Sky Sports](https://www.skysports.com/f1/news/12040/13304206/mercedes-driver-andrea-kimi-antonelli-rejects-lewis-hamilton-comparison-ahead-of-debut-formula-1-season) |
| Leclerc, from Monaco, joined Ferrari for 2019 and won the 2024 Monaco GP | [Monaco Tribune](https://www.monaco-tribune.com/en/listing/charles-leclerc/), [PlanetF1](https://www.planetf1.com/news/2024-monaco-grand-prix-monte-carlo-race-results-and-latest-f1-standings) |
| Alonso won titles with Renault in 2005 and 2006 and joined Aston Martin for 2023 | [CBS Sports](https://www.cbssports.com/motor-sports/news/aston-martin-signs-fernando-alonso-from-alpine-to-replace-sebastian-vettel-per-report), [Flashscore](https://www.flashscore.com/news/motorsport-formula-1-two-time-f1-champion-fernando-alonso-extends-aston-martin-contract/Gt13thLc) |
| Hamilton is a seven-time champion and moved from Mercedes to Ferrari in 2025 | [Top Gear](https://www.topgear.com/car-news/motorsport/five-things-weve-learned-about-brad-pitts-new-formula-one-movie), [Sky Sports](https://www.skysports.com/f1/news/12040/13304206/mercedes-driver-andrea-kimi-antonelli-rejects-lewis-hamilton-comparison-ahead-of-debut-formula-1-season) |
| *F1: The Movie* (2025) stars Brad Pitt as Sonny Hayes, who races car #7 for the fictional APXGP team | [Driven](https://www.drivencarguide.co.nz/news/hot-wheels-unveils-f1-the-movie-diecast-car/), [Top Gear](https://www.topgear.com/car-news/motorsport/five-things-weve-learned-about-brad-pitts-new-formula-one-movie) |

The nationalities of Hamilton (British) and Alonso (Spanish) are general knowledge and weren't searched separately.
