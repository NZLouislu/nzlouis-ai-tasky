-- ============================================
-- User Platform Credentials Storage
-- Store Jira and Trello connection parameters for each user
-- ============================================

-- 1. Update stories_platform_connections table structure
-- Add platform-specific connection parameter fields
ALTER TABLE stories_platform_connections 
ADD COLUMN IF NOT EXISTS platform_url TEXT,
ADD COLUMN IF NOT EXISTS platform_email TEXT,
ADD COLUMN IF NOT EXISTS api_token_encrypted TEXT,
ADD COLUMN IF NOT EXISTS project_key TEXT,
ADD COLUMN IF NOT EXISTS board_id TEXT,
ADD COLUMN IF NOT EXISTS additional_config JSONB DEFAULT '{}';

-- 2. Create user platform configuration table (if more detailed configuration is needed)
CREATE TABLE IF NOT EXISTS user_platform_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  platform VARCHAR(20) NOT NULL CHECK (platform IN ('jira', 'trello')),
  
  -- Jira specific configuration
  jira_url TEXT,
  jira_email TEXT,
  jira_api_token_encrypted TEXT,
  jira_project_key TEXT,
  
  -- Trello specific configuration
  trello_key_encrypted TEXT,
  trello_token_encrypted TEXT,
  trello_board_id TEXT,
  
  -- General configuration
  is_active BOOLEAN DEFAULT true,
  config_name VARCHAR(255) DEFAULT 'Default',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  CONSTRAINT unique_user_platform_config UNIQUE (user_id, platform, config_name)
);

-- 3. Create encryption functions (using pgcrypto extension)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 4. Create encryption/decryption functions
CREATE OR REPLACE FUNCTION encrypt_credential(credential TEXT, encryption_key TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN encode(
    pgp_sym_encrypt(credential, encryption_key),
    'base64'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrypt_credential(encrypted_credential TEXT, encryption_key TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN pgp_sym_decrypt(
    decode(encrypted_credential, 'base64'),
    encryption_key
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create indexes
CREATE INDEX IF NOT EXISTS idx_user_platform_configs_user_platform 
  ON user_platform_configs(user_id, platform);

CREATE INDEX IF NOT EXISTS idx_user_platform_configs_active 
  ON user_platform_configs(user_id, is_active) WHERE is_active = true;

-- 6. Enable row level security
ALTER TABLE user_platform_configs ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policies
DROP POLICY IF EXISTS "Users can access their own platform configs" ON user_platform_configs;
CREATE POLICY "Users can access their own platform configs"
ON user_platform_configs
FOR ALL
TO authenticated
USING (user_id = auth.uid()::text);

-- 8. Grant permissions
GRANT ALL ON user_platform_configs TO anon, authenticated, service_role;

-- 9. Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_platform_configs_updated_at ON user_platform_configs;
CREATE TRIGGER update_user_platform_configs_updated_at
    BEFORE UPDATE ON user_platform_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 10. Insert sample data structure (without real credentials)
-- This is just to show data structure, actual use should insert via API
/*
INSERT INTO user_platform_configs (
  user_id, 
  platform, 
  jira_url, 
  jira_email, 
  jira_project_key,
  config_name
) VALUES (
  'example-user-id',
  'jira',
  'https://example.atlassian.net',
  'user@example.com',
  'PROJ',
  'Main Jira Config'
) ON CONFLICT (user_id, platform, config_name) DO NOTHING;

INSERT INTO user_platform_configs (
  user_id, 
  platform, 
  trello_board_id,
  config_name
) VALUES (
  'example-user-id',
  'trello',
  'board123',
  'Main Trello Config'
) ON CONFLICT (user_id, platform, config_name) DO NOTHING;
*/

-- 11. Create view for secure configuration access
CREATE OR REPLACE VIEW user_platform_configs_safe AS
SELECT 
  id,
  user_id,
  platform,
  jira_url,
  jira_email,
  jira_project_key,
  trello_board_id,
  is_active,
  config_name,
  created_at,
  updated_at,
  -- Do not expose encrypted credentials
  CASE WHEN jira_api_token_encrypted IS NOT NULL THEN true ELSE false END as has_jira_token,
  CASE WHEN trello_key_encrypted IS NOT NULL THEN true ELSE false END as has_trello_key,
  CASE WHEN trello_token_encrypted IS NOT NULL THEN true ELSE false END as has_trello_token
FROM user_platform_configs;

-- 12. Create RLS policies for view
ALTER VIEW user_platform_configs_safe SET (security_barrier = true);
GRANT SELECT ON user_platform_configs_safe TO authenticated;