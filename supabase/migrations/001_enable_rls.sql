-- Enable Row Level Security on all tables

-- Chat Sessions
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own sessions"
ON chat_sessions
FOR ALL
USING (user_id = auth.uid());

-- Chat Messages
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access messages from their sessions"
ON chat_messages
FOR ALL
USING (
  session_id IN (
    SELECT id FROM chat_sessions WHERE user_id = auth.uid()
  )
);

-- Blog Posts
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own blog posts"
ON blog_posts
FOR ALL
USING (user_id = auth.uid());

-- Storage Files
ALTER TABLE storage_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own files"
ON storage_files
FOR ALL
USING (user_id = auth.uid());

-- User AI Settings
ALTER TABLE user_ai_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own AI settings"
ON user_ai_settings
FOR ALL
USING (user_id = auth.uid());

-- User API Keys
ALTER TABLE user_api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own API keys"
ON user_api_keys
FOR ALL
USING (user_id = auth.uid());

-- Documents
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own documents"
ON documents
FOR ALL
USING (user_id = auth.uid());

-- Stories
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access stories from their documents"
ON stories
FOR ALL
USING (
  document_id IN (
    SELECT id FROM documents WHERE user_id = auth.uid()
  )
);

-- Export Configs
ALTER TABLE export_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own export configs"
ON export_configs
FOR ALL
USING (user_id = auth.uid());
