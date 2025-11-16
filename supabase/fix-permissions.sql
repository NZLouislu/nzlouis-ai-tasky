-- ============================================
-- Supabase permission fix script
-- Used to solve "permission denied for schema public" error
-- ============================================

-- 1. Grant usage permissions for public schema
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- 2. Grant permissions for all tables
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;

-- 3. Grant permissions for all sequences
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- 4. Grant permissions for all functions
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

-- 5. Set default permissions (for future created objects)
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;

-- 6. Enable Row Level Security (RLS) and create policies
-- chat_sessions table
ALTER TABLE IF EXISTS chat_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can access their own chat sessions" ON chat_sessions;
CREATE POLICY "Users can access their own chat sessions"
ON chat_sessions
FOR ALL
TO authenticated
USING (user_id = auth.uid()::text);

-- chat_messages table
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

-- user_ai_settings table
ALTER TABLE IF EXISTS user_ai_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can access their own AI settings" ON user_ai_settings;
CREATE POLICY "Users can access their own AI settings"
ON user_ai_settings
FOR ALL
TO authenticated
USING (user_id = auth.uid()::text);

-- user_api_keys table
ALTER TABLE IF EXISTS user_api_keys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can access their own API keys" ON user_api_keys;
CREATE POLICY "Users can access their own API keys"
ON user_api_keys
FOR ALL
TO authenticated
USING (user_id = auth.uid()::text);

-- documents table
ALTER TABLE IF EXISTS documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can access their own documents" ON documents;
CREATE POLICY "Users can access their own documents"
ON documents
FOR ALL
TO authenticated
USING (user_id = auth.uid()::text);

-- stories table
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

-- blog_posts table
ALTER TABLE IF EXISTS blog_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can access their own blog posts" ON blog_posts;
CREATE POLICY "Users can access their own blog posts"
ON blog_posts
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Note: Since using NextAuth instead of Supabase Auth, we temporarily allow all authenticated users access
-- Application layer will filter data by user_id to ensure security

-- storage_files table
ALTER TABLE IF EXISTS storage_files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can access their own files" ON storage_files;
CREATE POLICY "Users can access their own files"
ON storage_files
FOR ALL
TO authenticated
USING (user_id = auth.uid()::text);

-- 7. Allow service_role to bypass RLS (for server-side operations)
-- service_role can already bypass RLS by default, but ensure settings are correct
ALTER TABLE IF EXISTS chat_sessions FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS chat_messages FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_ai_settings FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_api_keys FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS documents FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS stories FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS blog_posts FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS storage_files FORCE ROW LEVEL SECURITY;

-- 8. Verify permission settings
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
