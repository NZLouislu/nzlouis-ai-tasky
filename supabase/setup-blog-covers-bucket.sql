-- Create blog-covers bucket if it doesn't exist
-- This should be done in Supabase Dashboard > Storage

-- Set up RLS policies for blog-covers bucket
-- Allow authenticated users to upload their own files
CREATE POLICY "Users can upload their own cover images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'blog-covers' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access to all cover images
CREATE POLICY "Public can view cover images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'blog-covers');

-- Allow users to update their own files
CREATE POLICY "Users can update their own cover images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'blog-covers' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own files
CREATE POLICY "Users can delete their own cover images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'blog-covers' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
