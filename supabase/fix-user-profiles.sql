-- ============================================
-- Fix user record issues
-- Create user_profiles record for currently logged in user
-- ============================================

-- Step 1: Check if user_profiles table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'user_profiles';

-- Step 2: If table doesn't exist, create it
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

-- Step 3: Create record for your user ID
-- Replace the UUID below with your actual user ID: 2a1d747b-303a-4e2b-8894-1f010e5e2773
INSERT INTO user_profiles (id, email, name, created_at, updated_at)
VALUES (
  '2a1d747b-303a-4e2b-8894-1f010e5e2773',
  'your-email@example.com',  -- Replace with your email
  'Your Name',                -- Replace with your name
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Step 4: Verify user record has been created
SELECT id, email, name, created_at 
FROM user_profiles 
WHERE id = '2a1d747b-303a-4e2b-8894-1f010e5e2773';

-- Step 5: Enable RLS and create policies
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

-- Step 6: Grant permissions
GRANT ALL ON user_profiles TO anon, authenticated, service_role;
