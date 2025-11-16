-- ============================================
-- AI Tasky database table creation script
-- Generated based on Prisma Schema
-- ============================================

-- 1. Create user_ai_settings table
CREATE TABLE IF NOT EXISTS user_ai_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  default_provider VARCHAR(50) NOT NULL DEFAULT 'google',
  default_model VARCHAR(100) NOT NULL DEFAULT 'gemini-2.5-flash',
  temperature FLOAT NOT NULL DEFAULT 0.8,
  max_tokens INTEGER NOT NULL DEFAULT 1024,
  system_prompt TEXT NOT NULL DEFAULT 'You are a helpful AI assistant.',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_user_ai_settings_user FOREIGN KEY (user_id) 
    REFERENCES user_profiles(id) ON DELETE CASCADE
);

-- 2. Create user_api_keys table
CREATE TABLE IF NOT EXISTS user_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  provider VARCHAR(50) NOT NULL,
  key_encrypted TEXT NOT NULL,
  iv VARCHAR(255) NOT NULL,
  auth_tag VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_user_api_keys_user FOREIGN KEY (user_id) 
    REFERENCES user_profiles(id) ON DELETE CASCADE,
  CONSTRAINT unique_user_provider UNIQUE (user_id, provider)
);

-- 3. Create chat_sessions table
CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title VARCHAR(255) NOT NULL DEFAULT 'New Chat',
  provider VARCHAR(50) NOT NULL DEFAULT 'google',
  model VARCHAR(100) NOT NULL DEFAULT 'gemini-2.5-flash',
  temperature FLOAT NOT NULL DEFAULT 0.8,
  max_tokens INTEGER NOT NULL DEFAULT 1024,
  system_prompt TEXT NOT NULL DEFAULT 'You are a helpful AI assistant.',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_chat_sessions_user FOREIGN KEY (user_id) 
    REFERENCES user_profiles(id) ON DELETE CASCADE
);

-- 4. Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  image_url TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_chat_messages_session FOREIGN KEY (session_id) 
    REFERENCES chat_sessions(id) ON DELETE CASCADE
);

-- 5. Create documents table
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  session_id UUID,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_documents_user FOREIGN KEY (user_id) 
    REFERENCES user_profiles(id) ON DELETE CASCADE,
  CONSTRAINT fk_documents_session FOREIGN KEY (session_id) 
    REFERENCES chat_sessions(id) ON DELETE SET NULL
);

-- 6. Create stories table
CREATE TABLE IF NOT EXISTS stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  acceptance TEXT,
  priority VARCHAR(20) DEFAULT 'medium',
  estimate INTEGER,
  tags TEXT[] DEFAULT '{}',
  position INTEGER DEFAULT 0,
  exported BOOLEAN DEFAULT FALSE,
  exported_to VARCHAR(50),
  external_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_stories_document FOREIGN KEY (document_id) 
    REFERENCES documents(id) ON DELETE CASCADE
);

-- 7. Create storage_files table
CREATE TABLE IF NOT EXISTS storage_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  bucket_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR(100),
  entity_type VARCHAR(50),
  entity_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_storage_files_user FOREIGN KEY (user_id) 
    REFERENCES user_profiles(id) ON DELETE CASCADE
);

-- ============================================
-- Create indexes to optimize query performance
-- ============================================

-- user_api_keys indexes
CREATE INDEX IF NOT EXISTS idx_user_api_keys_user 
  ON user_api_keys(user_id);

-- chat_sessions indexes
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_created 
  ON chat_sessions(user_id, created_at DESC);

-- chat_messages indexes
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_created 
  ON chat_messages(session_id, created_at);

-- documents indexes
CREATE INDEX IF NOT EXISTS idx_documents_user_created 
  ON documents(user_id, created_at DESC);

-- stories indexes
CREATE INDEX IF NOT EXISTS idx_stories_document_position 
  ON stories(document_id, position);

-- storage_files indexes
CREATE INDEX IF NOT EXISTS idx_storage_files_user 
  ON storage_files(user_id);

CREATE INDEX IF NOT EXISTS idx_storage_files_entity 
  ON storage_files(entity_type, entity_id);

-- ============================================
-- Verify table creation
-- ============================================

SELECT 
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'user_ai_settings',
  'user_api_keys',
  'chat_sessions',
  'chat_messages',
  'documents',
  'stories',
  'storage_files'
)
ORDER BY table_name;
