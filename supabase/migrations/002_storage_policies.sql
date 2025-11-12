-- Storage Bucket Policies for "NZLouis Tasky"

-- Policy: Users can upload their own files
CREATE POLICY "Users can upload their own files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'NZLouis Tasky' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can read their own files
CREATE POLICY "Users can read their own files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'NZLouis Tasky' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can update their own files
CREATE POLICY "Users can update their own files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'NZLouis Tasky' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can delete their own files
CREATE POLICY "Users can delete their own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'NZLouis Tasky' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Create folder structure (documentation only, folders are created on first upload)
-- blog-images/{user_id}/{post_id}/{timestamp}-{filename}
-- blog-covers/{user_id}/{post_id}/cover.jpg
-- chat-images/{user_id}/{session_id}/{timestamp}-{filename}
-- avatars/{user_id}.jpg
