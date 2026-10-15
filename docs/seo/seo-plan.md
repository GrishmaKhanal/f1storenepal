# SEO plan: Lights Out Nepal (15 Oct 2026)

Indexed for 3 days. Competitive queries ("buy f1 diecast car nepal") are held by Daraz, a map pack and Ubuy, and won't flip in weeks. The realistic path: fix brand presentation, win long-tail product queries, build reviews and mentions. Nothing here guarantees rankings.

Already in progress elsewhere: favicon, `alternateName`, homepage h1, product descriptions, alt text, image sitemap. Effort: S <1h, M = 0.5–2 days, L = ongoing.

## This week

**1. Decide the domain now (M, high long-term impact).** Every week of rankings on `bit-overflow.com` is something a later move must carry over.
- `lightsoutnepal.com.np` is free at the registry ([register.com.np](https://register.com.np/FAQs)). Needs a firm registration certificate (or PAN certificate if unincorporated); the name must derive from the company/product/brand name; ~3–4 business days. A ccTLD is a "strong signal" of Nepal targeting.
- `lightsoutnepal.com` was unregistered on 15 Oct (whois). It is paid and instant.
- Keep "F1" out of the domain: it's a Formula One trademark (legal position unverified).
- How to move:
  1. Point the new domain at the same deployment.
  2. Add a path-for-path 301 from every old URL.
  3. Switch canonicals, sitemap and JSON-LD to the new host.
  4. Verify both hosts in Search Console with the same Google account.
  5. Run Settings → Change of Address (Google lists `m.example.com` as a valid source, so the subdomain should qualify; confirm in the tool).
  6. Submit the new sitemap and update the Instagram bio.
  7. Keep the redirects for at least 1 year.
- Expect temporary ranking wobble. Staying on the subdomain is also viable; Google treats it as its own site.

**2. Search Console hygiene (S, medium).** Verify the property and submit `sitemap.xml`. Once the favicon and site-name fixes deploy, open URL Inspection on the homepage → Test live URL → Request indexing, then repeat for `/accessories/model-cars`. Validate WebSite markup with the Schema Markup Validator (the Rich Results Test ignores site names). Google says these updates take "several days to several weeks".

**3. One name everywhere (S, medium).** "f1 store nepal website" finds Instagram because its display name is literally "F1 Store Nepal". Use one pattern, for example "Lights Out Nepal | F1 Store Nepal", on Instagram, Facebook and the site's `alternateName`. Put the site URL in the bio.

**4. Sharpen the diecast category page (S–M, medium).** `/accessories/model-cars` is titled "F1 model cars" with h1 "Model cars".
- Change the title to "F1 Diecast Cars in Nepal: Bburago 1:43 | Lights Out Nepal" and the h1 to "F1 diecast cars in Nepal".
- Add 150–250 words (scale, box contents, Rs 4,050, delivery, payment) and a short FAQ.
- Work "price in Nepal" (a common Nepali pattern) into product titles naturally.
- Remove "caps", "keychains" and "gifts" from the meta descriptions (home, driver pages) unless you stock them.

## This month

**5. Google Business Profile, only if eligible (M, high for the map pack).**
- Eligibility: a location customers can visit, or a business that travels to customers. Pure courier delivery does not clearly qualify.
- If you hand-deliver in the Kathmandu Valley yourself: create a service-area profile, hide the address, set service areas (Kathmandu, Lalitpur, Bhaktapur), name it exactly "Lights Out Nepal" (no keywords).
- Do not invent an address, because that risks suspension.
- Local ranking depends on relevance, distance and prominence (reviews, links). ATG Nepal and Happy Hours already have many reviews, so expect slow progress.
- Unverified: which verification methods work in Nepal, and which categories allow a hidden address.

**6. Collect genuine reviews (M, medium).** Ask every delivered customer through the order email, tracking page or WhatsApp. Show them on product pages with Review/AggregateRating markup (reviews must be visible). Never on Store/Organization: self-serving reviews are ineligible.

**7. Four content pages (M each, slow but compounding).**
- **F1 race times in Nepal time (NPT):** "f1 nepal time" is a top autocomplete suggestion. Informational, but recurs every race weekend.
- **Bburago 1:43 buying guide:** scale, range, how COD works; gives AI Overviews a factual source besides Daraz.
- **F1 gifts in Nepal:** "gifts for boyfriend nepal" and "f1 gifts" both autocomplete.
- **Devanagari version of one page:** experiment; demand unverified.

**8. Consider also selling on Daraz (business decision).** Daraz's tag page is #1 and the AI Overview cites it. A "Lights Out Nepal" seller listing puts you inside a result you won't outrank soon. Needs PAN/VAT; commission and cannibalisation unverified.

**9. Instagram as a feeder (S).** Since July 2025, public posts from professional accounts can be indexed by Google. Captions should name the product, scale, price and "Nepal"; link stickers should go to product pages.

## Ongoing

**10. Earn mentions, not directories (L, medium).**
- Pitch Nepali gift-guide/lifestyle blogs, F1 fan pages and watch-party organisers; offer giveaways or photos.
- r/Nepal treats purely promotional posts as spam (per a mirror of its rules, unverified). Participate genuinely or skip it.
- Avoid paid links and bulk directories.

**11. Widen the catalogue where demand shows (M).** Autocomplete shows "lego f1 car nepal", "hot wheels f1", "f1 jersey nepal" and "red bull toy car f1". Each stocked product is another long-tail page.

**12. Monthly check (S).** In Search Console → Performance, filter out brand queries and track impressions and position for the table below. Check Pages for unindexed URLs; count Google-referred orders.

**Not available:** Merchant Center free listings (Nepal isn't on Google's 48-country list).

## Keywords

From Google autocomplete (gl=np, 15 Oct): proves a query exists, not its volume. Volumes unverified.

| Query | Intent | Target page |
|---|---|---|
| f1 merch nepal / f1 merchandise nepal / f1 shop nepal | Buy | Home |
| diecast car nepal / f1 diecast nepal | Buy | /accessories/model-cars |
| f1 car price in nepal / f1 toy car price in nepal | Price check | Model cars + products |
| bburago f1 1/43, red bull toy car f1, [driver] diecast | Buy | Product + driver pages |
| f1 posters for wall / f1 poster ferrari | Buy | /accessories/wall-posters |
| f1 nepal time | Info | Race-times page |
| gifts for boyfriend nepal / f1 gifts for him | Gift | Gift guide |
| lego f1 car nepal | Buy | Only if stocked |
| Romanized/Devanagari (e.g. "f1 ko gadi") | ? | Unverified: no autocomplete data |

Caution: "f1 nepal" autocomplete is dominated by **F-1 student visa** queries, and "formula 1 price in nepal" partly means a **scooter**. Bare "F1 Nepal" phrasing is ambiguous, so pair it with diecast, merch, poster or the brand name.

## Sources

- Site names: https://developers.google.com/search/docs/appearance/site-names
- Favicon: https://developers.google.com/search/docs/appearance/favicon-in-search
- Recrawl: https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl
- Change of Address: https://support.google.com/webmasters/answer/9370220
- Site moves: https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes
- ccTLD signals: https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites
- Subdomains (Mueller): https://www.searchenginejournal.com/google-treats-subdomains-subdirectories-john-mueller-says/254687/
- GBP guidelines: https://support.google.com/business/answer/3038177
- GBP service areas: https://support.google.com/business/answer/10514137
- Local ranking: https://support.google.com/business/answer/7091
- Free listings countries: https://support.google.com/merchants/answer/13692890 (Shopify-app version of the list; confirm in Merchant Center)
- Review snippets: https://developers.google.com/search/docs/appearance/structured-data/review-snippet
- .np registry: https://register.com.np/FAQs, https://register.com.np/registry-policy
- Daraz tag page: https://www.daraz.com.np/tag/diecast-f1/; seller requirements: https://www.daraz.com.np/sell-books-on-daraz/
- Instagram indexing: https://ppc.land/instagram-content-becomes-searchable-on-google-starting-july-10/
- Google autocomplete via suggestqueries.google.com (gl=np), queried 15 Oct 2026
