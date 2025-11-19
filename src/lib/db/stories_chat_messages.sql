CREATE TABLE IF NOT EXISTS stories_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content JSONB NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_stories_chat_messages_document_id ON stories_chat_messages(document_id);
CREATE INDEX idx_stories_chat_messages_user_id ON stories_chat_messages(user_id);
CREATE INDEX idx_stories_chat_messages_timestamp ON stories_chat_messages(timestamp DESC);

CREATE OR REPLACE FUNCTION update_stories_chat_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_stories_chat_messages_updated_at
  BEFORE UPDATE ON stories_chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_stories_chat_messages_updated_at();
