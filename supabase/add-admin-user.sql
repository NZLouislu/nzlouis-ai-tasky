-- ============================================
-- Add Admin user to database
-- ============================================

-- Step 1: Create admin user record in user_profiles table
INSERT INTO user_profiles (
  id,
  email,
  name,
  image,
  email_verified,
  created_at,
  updated_at
)
VALUES (
  'admin-user-id',
  'admin@nzlouis.com',
  'Admin',
  NULL,
  NOW(),
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  updated_at = NOW();

-- Step 2: Create default AI settings for admin user
INSERT INTO user_ai_settings (
  id,
  user_id,
  default_provider,
  default_model,
  temperature,
  max_tokens,
  system_prompt,
  created_at,
  updated_at
)
VALUES (
  gen_random_uuid(),
  'admin-user-id',
  'google',
  'gemini-2.5-flash',
  0.8,
  2048,
  'You are a helpful AI assistant with vision capabilities. You can see and analyze images provided by users.',
  NOW(),
  NOW()
)
ON CONFLICT (user_id) DO UPDATE SET
  updated_at = NOW();

-- Step 3: Verify admin user has been created
SELECT 
  id,
  email,
  name,
  created_at,
  updated_at
FROM user_profiles
WHERE id = 'admin-user-id';

-- Step 4: Verify admin user's AI settings have been created
SELECT 
  id,
  user_id,
  default_provider,
  default_model,
  temperature,
  max_tokens
FROM user_ai_settings
WHERE user_id = 'admin-user-id';
