-- ============================================
-- Supabase 权限修复脚本
-- 用于解决 "permission denied for schema public" 错误
-- ============================================

-- 1. 授予 public schema 的使用权限
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- 2. 授予所有表的权限
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;

-- 3. 授予所有序列的权限
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- 4. 授予所有函数的权限
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

-- 5. 设置默认权限（对未来创建的对象）
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;

-- 6. 启用 Row Level Security (RLS) 并创建策略
-- chat_sessions 表
ALTER TABLE IF EXISTS chat_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can access their own chat sessions" ON chat_sessions;
CREATE POLICY "Users can access their own chat sessions"
ON chat_sessions
FOR ALL
TO authenticated
USING (user_id = auth.uid()::text);

-- chat_messages 表
ALTER TABLE IF EXISTS chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can access messages from their sessions" ON chat_messages;
CREATE POLICY "Users can access messages from their sessions"
ON chat_messages
FOR ALL
TO authenticated
USING (
  session_id IN (
    SELECT id FROM chat_sessions WHERE user_id = auth.uid()::text
  )
);

-- user_ai_settings 表
ALTER TABLE IF EXISTS user_ai_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can access their own AI settings" ON user_ai_settings;
CREATE POLICY "Users can access their own AI settings"
ON user_ai_settings
FOR ALL
TO authenticated
USING (user_id = auth.uid()::text);

-- user_api_keys 表
ALTER TABLE IF EXISTS user_api_keys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can access their own API keys" ON user_api_keys;
CREATE POLICY "Users can access their own API keys"
ON user_api_keys
FOR ALL
TO authenticated
USING (user_id = auth.uid()::text);

-- documents 表
ALTER TABLE IF EXISTS documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can access their own documents" ON documents;
CREATE POLICY "Users can access their own documents"
ON documents
FOR ALL
TO authenticated
USING (user_id = auth.uid()::text);

-- stories 表
ALTER TABLE IF EXISTS stories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can access stories from their documents" ON stories;
CREATE POLICY "Users can access stories from their documents"
ON stories
FOR ALL
TO authenticated
USING (
  document_id IN (
    SELECT id FROM documents WHERE user_id = auth.uid()::text
  )
);

-- blog_posts 表
ALTER TABLE IF EXISTS blog_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can access their own blog posts" ON blog_posts;
CREATE POLICY "Users can access their own blog posts"
ON blog_posts
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 注意：由于使用 NextAuth 而不是 Supabase Auth，我们暂时允许所有认证用户访问
-- 应用层会通过 user_id 过滤数据来确保安全性

-- storage_files 表
ALTER TABLE IF EXISTS storage_files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can access their own files" ON storage_files;
CREATE POLICY "Users can access their own files"
ON storage_files
FOR ALL
TO authenticated
USING (user_id = auth.uid()::text);

-- 7. 允许 service_role 绕过 RLS（用于服务端操作）
-- service_role 默认已经可以绕过 RLS，但确保设置正确
ALTER TABLE IF EXISTS chat_sessions FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS chat_messages FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_ai_settings FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_api_keys FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS documents FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS stories FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS blog_posts FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS storage_files FORCE ROW LEVEL SECURITY;

-- 8. 验证权限设置
SELECT 
  schemaname,
  tablename,
  tableowner,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
  'chat_sessions',
  'chat_messages',
  'user_ai_settings',
  'user_api_keys',
  'documents',
  'stories',
  'blog_posts',
  'storage_files'
)
ORDER BY tablename;
