-- Update all users' default AI provider to OpenRouter
-- This avoids using Google Gemini which has exhausted quota

UPDATE user_ai_settings 
SET 
  "defaultProvider" = 'openrouter',
  "defaultModel" = 'deepseek/deepseek-v3',
  "updatedAt" = NOW()
WHERE "defaultProvider" = 'google';

-- If no settings record exists, create default settings for all users
INSERT INTO user_ai_settings ("userId", "defaultProvider", "defaultModel", temperature, "maxTokens", "systemPrompt", "createdAt", "updatedAt")
SELECT 
  id,
  'openrouter',
  'deepseek/deepseek-v3',
  0.8,
  1024,
  'You are a helpful AI assistant.',
  NOW(),
  NOW()
FROM user_profiles
WHERE id NOT IN (SELECT "userId" FROM user_ai_settings)
ON CONFLICT ("userId") DO NOTHING;

-- View update results
SELECT 
  up.email,
  uas."defaultProvider",
  uas."defaultModel"
FROM user_profiles up
LEFT JOIN user_ai_settings uas ON up.id = uas."userId";
