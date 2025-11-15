-- ============================================
-- 添加 Admin 用户到数据库
-- ============================================

-- 步骤 1: 在 user_profiles 表中创建 admin 用户记录
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

-- 步骤 2: 为 admin 用户创建默认 AI 设置
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

-- 步骤 3: 验证 admin 用户已创建
SELECT 
  id,
  email,
  name,
  created_at,
  updated_at
FROM user_profiles
WHERE id = 'admin-user-id';

-- 步骤 4: 验证 admin 用户的 AI 设置已创建
SELECT 
  id,
  user_id,
  default_provider,
  default_model,
  temperature,
  max_tokens
FROM user_ai_settings
WHERE user_id = 'admin-user-id';
