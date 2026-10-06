-- Rebrand: F1 Store Nepal -> Lights Out Nepal, with copy aimed at all of Nepal.
-- Replaces only the settings that still hold the old starter text, so anything
-- edited in the admin is kept. New settings (serviceAreas, seoKeywords) need no
-- update: missing fields fall back to src/content/seed.ts.
UPDATE "settings" SET "value" = "value"
  || CASE WHEN "value"->'storeName' = '"F1 Store Nepal"'::jsonb
       THEN '{"storeName":"Lights Out Nepal"}'::jsonb ELSE '{}'::jsonb END
  || CASE WHEN "value"->'tagline' = '"Cars · Gifts"'::jsonb
       THEN '{"tagline":"F1 merch & diecast, delivered across Nepal"}'::jsonb ELSE '{}'::jsonb END
  || CASE WHEN "value"->'announcements' = '["Delivered across Nepal from Jhapa","Cash on delivery · eSewa · Khalti"]'::jsonb
       THEN '{"announcements":["Delivery anywhere in Nepal: Kathmandu, Pokhara and beyond","Cash on delivery · eSewa · Khalti"]}'::jsonb ELSE '{}'::jsonb END
  || CASE WHEN "value"->'steps' = '[{"title":"Order online or on Instagram","body":"Check out here or DM @f1storenepal."},{"title":"Pay your way","body":"eSewa, Khalti, bank transfer or cash on delivery."},{"title":"Delivered across Nepal","body":"Shipped from Jhapa. Delivery times depend on your area."}]'::jsonb
       THEN '{"steps":[{"title":"Order online or on Instagram","body":"Check out here, or DM us on Instagram."},{"title":"Pay your way","body":"eSewa, Khalti, bank transfer or cash on delivery."},{"title":"Delivered across Nepal","body":"Kathmandu, Pokhara or anywhere else in Nepal. Delivery time depends on your area."}]}'::jsonb ELSE '{}'::jsonb END
  || CASE WHEN "value"->'deliveryInfo' = '"We ship from Jhapa to anywhere in Nepal.\n\nDelivery fees depend on your area and are shown at checkout. We''ll call or message you to confirm every order before it ships."'::jsonb
       THEN '{"deliveryInfo":"We deliver anywhere in Nepal: Kathmandu Valley, Pokhara, Chitwan, Butwal, Biratnagar, Dharan, Birgunj and everywhere in between.\n\nDelivery fees depend on your area and are shown at checkout. We''ll call or message you to confirm every order before it ships."}'::jsonb ELSE '{}'::jsonb END
  || CASE WHEN "value"->'seoTitle' = '"F1 Store Nepal: F1 diecast cars, caps and gifts"'::jsonb
       THEN '{"seoTitle":"Lights Out Nepal | F1 Merch Store, Diecast Cars & Gifts"}'::jsonb ELSE '{}'::jsonb END
  || CASE WHEN "value"->'seoDescription' = '"Formula 1 diecast model cars, team caps, keychains and gifts, delivered across Nepal from Jhapa. Shop by driver or team. Cash on delivery, eSewa and Khalti."'::jsonb
       THEN '{"seoDescription":"F1 merch in Nepal: diecast F1 cars, team caps, keychains and Formula 1 gifts. Delivered to Kathmandu, Pokhara and all of Nepal. Cash on delivery."}'::jsonb ELSE '{}'::jsonb END
WHERE "key" = 'site';
