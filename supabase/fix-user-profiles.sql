-- ============================================
-- 修复用户记录问题
-- 为当前登录的用户创建 user_profiles 记录
-- ============================================

-- 步骤 1: 检查 user_profiles 表是否存在
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'user_profiles';

-- 步骤 2: 如果表不存在，创建它
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(255) UNIQUE,
  email VARCHAR(255) UNIQUE,
  email_verified TIMESTAMP WITH TIME ZONE,
  name VARCHAR(255),
  image TEXT,
  full_name VARCHAR(255),
  avatar_url TEXT,
  website VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 步骤 3: 为你的用户 ID 创建记录
-- 替换下面的 UUID 为你的实际用户 ID: 2a1d747b-303a-4e2b-8894-1f010e5e2773
INSERT INTO user_profiles (id, email, name, created_at, updated_at)
VALUES (
  '2a1d747b-303a-4e2b-8894-1f010e5e2773',
  'your-email@example.com',  -- 替换为你的邮箱
  'Your Name',                -- 替换为你的名字
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 步骤 4: 验证用户记录已创建
SELECT id, email, name, created_at 
FROM user_profiles 
WHERE id = '2a1d747b-303a-4e2b-8894-1f010e5e2773';

-- 步骤 5: 启用 RLS 并创建策略
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
CREATE POLICY "Users can view their own profile"
ON user_profiles
FOR SELECT
TO authenticated
USING (id = auth.uid()::text);

DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
CREATE POLICY "Users can update their own profile"
ON user_profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid()::text);

-- 步骤 6: 授予权限
GRANT ALL ON user_profiles TO anon, authenticated, service_role;
