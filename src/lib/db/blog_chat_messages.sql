CREATE TABLE IF NOT EXISTS blog_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content JSONB NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_blog_chat_messages_post_id ON blog_chat_messages(post_id);
CREATE INDEX idx_blog_chat_messages_user_id ON blog_chat_messages(user_id);
CREATE INDEX idx_blog_chat_messages_timestamp ON blog_chat_messages(timestamp DESC);

CREATE OR REPLACE FUNCTION update_blog_chat_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_blog_chat_messages_updated_at
  BEFORE UPDATE ON blog_chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_blog_chat_messages_updated_at();
