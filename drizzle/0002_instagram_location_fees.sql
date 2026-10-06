-- Instagram moved from @f1storenepal to @lightsoutnepal, the footer no longer
-- shows where the store ships from (location left empty; the new footerAbout
-- field falls back to src/content/seed.ts), and every delivery area is Rs 150.
-- Replaces only values that still hold the old starter text, so anything
-- edited in the admin is kept.
UPDATE "settings" SET "value" = "value"
  || CASE WHEN "value"->'instagramUrl' = '"https://www.instagram.com/f1storenepal/"'::jsonb
       THEN '{"instagramUrl":"https://www.instagram.com/lightsoutnepal/"}'::jsonb ELSE '{}'::jsonb END
  || CASE WHEN "value"->'instagramHandle' = '"@f1storenepal"'::jsonb
       THEN '{"instagramHandle":"@lightsoutnepal"}'::jsonb ELSE '{}'::jsonb END
  || CASE WHEN "value"->'location' = '"Jhapa, Nepal"'::jsonb
       THEN '{"location":null}'::jsonb ELSE '{}'::jsonb END
  || CASE WHEN "value"->'deliveryZones' = '[{"name":"Jhapa","fee":100},{"name":"Rest of Koshi Province","fee":150},{"name":"Kathmandu Valley","fee":200},{"name":"Elsewhere in Nepal","fee":250}]'::jsonb
       THEN '{"deliveryZones":[{"name":"Jhapa","fee":150},{"name":"Rest of Koshi Province","fee":150},{"name":"Kathmandu Valley","fee":150},{"name":"Elsewhere in Nepal","fee":150}]}'::jsonb ELSE '{}'::jsonb END
WHERE "key" = 'site';
