-- ============================================
-- Fix Blog Posts RLS policies
-- Adapt for NextAuth instead of Supabase Auth
-- ============================================

-- Option 1: Temporarily allow all authenticated users access (recommended for development environment)
-- Application layer filters by user_id to ensure security

DROP POLICY IF EXISTS "Users can access their own blog posts" ON blog_posts;

CREATE POLICY "Allow authenticated users full access to blog_posts"
ON blog_posts
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Option 2: If you want stricter control, you can use service_role
-- But this requires using service_role key instead of anon key in application layer

-- Verify if policies are effective
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'blog_posts';

-- Check if RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'blog_posts';
