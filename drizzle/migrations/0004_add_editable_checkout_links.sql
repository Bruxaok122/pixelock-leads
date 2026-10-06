ALTER TABLE public.tracking_settings ADD COLUMN checkout_links jsonb;
ALTER TABLE public.tracking_settings ADD CONSTRAINT tracking_settings_checkout_links_object CHECK (checkout_links IS NULL OR jsonb_typeof(checkout_links) = 'object');
INSERT INTO public.tracking_settings (setting_key, checkout_links, enabled)
SELECT 'checkout_links', '{"149.99":"https://syncpaycheckout.com/checkout/a2d9aa7b-6938-4b1a-9674-c41fbecc09c7+a2d9ae6f-7cb7-4199-9ad3-ca064a0f1649","119.99":"https://syncpaycheckout.com/checkout/a2d9b348-b36a-4e02-b206-e00c8084846a+a2d9ae6f-7cb7-4199-9ad3-ca064a0f1649","19":"https://syncpaycheckout.com/checkout/a2d9b375-505e-40b5-ae64-f85dfe733bbb+a2d9ae6f-7cb7-4199-9ad3-ca064a0f1649"}'::jsonb, true
FROM public.tracking_settings WHERE setting_key = 'meta_pixel'
ON CONFLICT (setting_key) DO NOTHING;
CREATE POLICY "Public can read checkout links" ON public.tracking_settings FOR SELECT TO anon, authenticated USING (setting_key = 'checkout_links');