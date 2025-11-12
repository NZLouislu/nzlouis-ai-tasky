-- ============================================
-- 修复 Blog Posts 的 RLS 策略
-- 适配 NextAuth 而不是 Supabase Auth
-- ============================================

-- 方案 1: 暂时允许所有认证用户访问（推荐用于开发环境）
-- 应用层通过 user_id 过滤确保安全性

DROP POLICY IF EXISTS "Users can access their own blog posts" ON blog_posts;

CREATE POLICY "Allow authenticated users full access to blog_posts"
ON blog_posts
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 方案 2: 如果你想要更严格的控制，可以使用 service_role
-- 但这需要在应用层使用 service_role key 而不是 anon key

-- 验证策略是否生效
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

-- 检查 RLS 是否启用
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'blog_posts';
