
INSERT INTO storage.buckets (id, name, public) VALUES ('term-images', 'term-images', true);

CREATE POLICY "Anyone can read term images" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'term-images');
CREATE POLICY "Service role can insert term images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'term-images');
