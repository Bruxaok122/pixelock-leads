ALTER TABLE public.tracking_settings ADD COLUMN utmify_pixel_id text;
ALTER TABLE public.tracking_settings ADD CONSTRAINT tracking_settings_utmify_pixel_id_format CHECK (utmify_pixel_id IS NULL OR utmify_pixel_id ~ '^[0-9a-fA-F]{24}$');
INSERT INTO public.tracking_settings (setting_key, utmify_pixel_id, enabled)
SELECT 'utmify_pixel', '6aba91af2ec859491d9e07ff', true
FROM public.tracking_settings WHERE setting_key = 'meta_pixel'
ON CONFLICT (setting_key) DO NOTHING;
GRANT SELECT ON public.tracking_settings TO anon, authenticated;
CREATE POLICY "Public can read UTMify pixel settings" ON public.tracking_settings FOR SELECT TO anon, authenticated USING (setting_key = 'utmify_pixel');