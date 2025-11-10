ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS email_verified TIMESTAMP;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS image TEXT;

CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  type VARCHAR(255) NOT NULL,
  provider VARCHAR(255) NOT NULL,
  provider_account_id VARCHAR(255) NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at INTEGER,
  token_type VARCHAR(255),
  scope TEXT,
  id_token TEXT,
  session_state TEXT,
  UNIQUE(provider, provider_account_id)
);

CREATE INDEX IF NOT EXISTS accounts_user_id_idx ON accounts(user_id);

CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token VARCHAR(255) UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  expires TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions(user_id);

CREATE TABLE IF NOT EXISTS verification_tokens (
  identifier VARCHAR(255) NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires TIMESTAMP NOT NULL,
  UNIQUE(identifier, token)
);

CREATE TABLE IF NOT EXISTS user_ai_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  default_provider VARCHAR(255) DEFAULT 'google',
  default_model VARCHAR(255) DEFAULT 'gemini-2.5-flash',
  temperature FLOAT DEFAULT 0.8,
  max_tokens INTEGER DEFAULT 1024,
  system_prompt TEXT DEFAULT 'You are a helpful AI assistant.',
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  provider VARCHAR(255) NOT NULL,
  key_encrypted TEXT NOT NULL,
  iv VARCHAR(255) NOT NULL,
  auth_tag VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(user_id, provider)
);

CREATE INDEX IF NOT EXISTS user_api_keys_user_id_idx ON user_api_keys(user_id);

CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  title VARCHAR(255) DEFAULT 'New Chat',
  provider VARCHAR(255) DEFAULT 'google',
  model VARCHAR(255) DEFAULT 'gemini-2.5-flash',
  temperature FLOAT DEFAULT 0.8,
  max_tokens INTEGER DEFAULT 1024,
  system_prompt TEXT DEFAULT 'You are a helpful AI assistant.',
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS chat_sessions_user_id_created_at_idx ON chat_sessions(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS chat_messages_session_id_created_at_idx ON chat_messages(session_id, created_at);

CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  session_id UUID REFERENCES chat_sessions(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS documents_user_id_created_at_idx ON documents(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  acceptance TEXT,
  priority VARCHAR(50) DEFAULT 'medium',
  estimate INTEGER,
  tags TEXT[] DEFAULT '{}',
  position INTEGER DEFAULT 0,
  exported BOOLEAN DEFAULT false,
  exported_to VARCHAR(50),
  external_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS stories_document_id_position_idx ON stories(document_id, position);

CREATE TABLE IF NOT EXISTS export_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  workspace VARCHAR(255),
  board_id VARCHAR(255),
  project_key VARCHAR(255),
  list_id VARCHAR(255),
  issue_type VARCHAR(50) DEFAULT 'Story',
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(user_id, platform)
);

CREATE INDEX IF NOT EXISTS export_configs_user_id_idx ON export_configs(user_id);
