-- Check Stories Tables Structure and Data

-- 1. Check if tables exist
SELECT 
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'stories_projects',
  'stories_documents',
  'stories_sync_history',
  'stories_platform_connections'
)
ORDER BY table_name;

-- 2. Check stories_documents table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'stories_documents'
ORDER BY ordinal_position;

-- 3. Check stories_projects table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'stories_projects'
ORDER BY ordinal_position;

-- 4. Check existing projects (if any)
SELECT 
  id,
  user_id,
  platform,
  project_name,
  connection_status,
  created_at
FROM stories_projects
ORDER BY created_at DESC
LIMIT 10;

-- 5. Check existing documents (if any)
SELECT 
  id,
  project_id,
  document_type,
  title,
  file_name,
  created_at,
  updated_at
FROM stories_documents
ORDER BY created_at DESC
LIMIT 10;

-- 6. Check constraints on stories_documents
SELECT
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.table_schema = 'public'
AND tc.table_name = 'stories_documents';
