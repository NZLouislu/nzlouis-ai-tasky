-- ============================================================================
-- Blog Smart AI Assistant - Database Setup
-- ============================================================================
-- Description: Create tables for AI-powered blog writing features
-- Version: 1.0
-- Created: 2025-11-23
-- Tables: article_versions
-- Features: Version control, automatic backup, RLS policies
-- ============================================================================

-- ============================================================================
-- 1. CREATE TABLE: article_versions
-- ============================================================================
-- Purpose: Store version history of blog posts for rollback and comparison
-- ============================================================================

CREATE TABLE IF NOT EXISTS article_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id TEXT NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  content JSONB NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT REFERENCES user_profiles(id) ON DELETE SET NULL
);

-- Add helpful comment
COMMENT ON TABLE article_versions IS 'Stores version history of blog posts for AI-assisted editing';
COMMENT ON COLUMN article_versions.post_id IS 'Reference to the blog post';
COMMENT ON COLUMN article_versions.content IS 'BlogNote content snapshot in JSONB format';
COMMENT ON COLUMN article_versions.metadata IS 'Metadata: trigger type (ai/auto/manual), description, etc.';
COMMENT ON COLUMN article_versions.created_by IS 'User who created this version';

-- ============================================================================
-- 2. CREATE INDEXES
-- ============================================================================
-- Purpose: Optimize query performance for version retrieval
-- ============================================================================

-- Index for fetching version history (most recent first)
CREATE INDEX IF NOT EXISTS idx_versions_post_date 
ON article_versions(post_id, created_at DESC);

-- Index for filtering by creation date
CREATE INDEX IF NOT EXISTS idx_versions_created_at 
ON article_versions(created_at DESC);

-- Index for user-specific queries
CREATE INDEX IF NOT EXISTS idx_versions_user 
ON article_versions(created_by);

-- ============================================================================
-- 3. CREATE TRIGGER: Auto-save version on content update
-- ============================================================================
-- Purpose: Automatically save a version whenever blog post content changes
-- ============================================================================

-- Drop existing function/trigger if exists
DROP TRIGGER IF EXISTS auto_version_on_update ON blog_posts;
DROP FUNCTION IF EXISTS save_article_version();

-- Create function to save version
CREATE OR REPLACE FUNCTION save_article_version()
RETURNS TRIGGER AS $$
BEGIN
  -- Only save if content actually changed
  IF OLD.content IS DISTINCT FROM NEW.content THEN
    INSERT INTO article_versions (
      post_id,
      content,
      metadata,
      created_by
    ) VALUES (
      NEW.id,
      NEW.content,
      jsonb_build_object(
        'trigger', 'auto_save',
        'title', NEW.title,
        'updated_at', NEW.updated_at
      ),
      NEW.user_id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER auto_version_on_update
AFTER UPDATE OF content ON blog_posts
FOR EACH ROW
EXECUTE FUNCTION save_article_version();

COMMENT ON FUNCTION save_article_version() IS 
'Automatically saves a version of the blog post when content is modified';

-- ============================================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
-- Purpose: Ensure users can only access their own version history
-- ============================================================================

-- Enable RLS
ALTER TABLE article_versions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own article versions" ON article_versions;
DROP POLICY IF EXISTS "Users can create article versions" ON article_versions;
DROP POLICY IF EXISTS "Users can delete their own article versions" ON article_versions;

-- Policy 1: Users can view their own article versions
CREATE POLICY "Users can view their own article versions"
ON article_versions
FOR SELECT
USING (
  created_by = auth.uid()::TEXT
  OR 
  post_id IN (
    SELECT id FROM blog_posts WHERE user_id = auth.uid()::TEXT
  )
);

-- Policy 2: Users can create versions for their own posts
CREATE POLICY "Users can create article versions"
ON article_versions
FOR INSERT
WITH CHECK (
  post_id IN (
    SELECT id FROM blog_posts WHERE user_id = auth.uid()::TEXT
  )
);

-- Policy 3: Users can delete their own versions
CREATE POLICY "Users can delete their own article versions"
ON article_versions
FOR DELETE
USING (
  created_by = auth.uid()::TEXT
  OR
  post_id IN (
    SELECT id FROM blog_posts WHERE user_id = auth.uid()::TEXT
  )
);

-- ============================================================================
-- 5. HELPER FUNCTIONS (Optional but useful)
-- ============================================================================

-- Function: Get version count for a post
CREATE OR REPLACE FUNCTION get_version_count(p_post_id TEXT)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM article_versions
    WHERE post_id = p_post_id
  );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_version_count(TEXT) IS 
'Returns the number of versions for a given blog post';

-- Function: Get latest version for a post
CREATE OR REPLACE FUNCTION get_latest_version(p_post_id TEXT)
RETURNS TABLE (
  id UUID,
  content JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ,
  created_by TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    av.id,
    av.content,
    av.metadata,
    av.created_at,
    av.created_by
  FROM article_versions av
  WHERE av.post_id = p_post_id
  ORDER BY av.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_latest_version(TEXT) IS 
'Returns the most recent version for a given blog post';

-- Function: Cleanup old versions (keep last N versions)
CREATE OR REPLACE FUNCTION cleanup_old_versions(
  p_post_id TEXT,
  p_keep_count INTEGER DEFAULT 50
)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  WITH versions_to_keep AS (
    SELECT id
    FROM article_versions
    WHERE post_id = p_post_id
    ORDER BY created_at DESC
    LIMIT p_keep_count
  )
  DELETE FROM article_versions
  WHERE post_id = p_post_id
    AND id NOT IN (SELECT id FROM versions_to_keep);
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_old_versions(TEXT, INTEGER) IS 
'Deletes old versions keeping only the most recent N versions';

-- ============================================================================
-- 6. VERIFICATION QUERIES
-- ============================================================================
-- Purpose: Verify the setup is correct
-- ============================================================================

-- Check if table exists
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'article_versions'
  ) THEN
    RAISE NOTICE 'Table article_versions created successfully';
  ELSE
    RAISE WARNING 'Table article_versions was not created';
  END IF;
END $$;

-- Check if indexes exist
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM pg_indexes 
    WHERE tablename = 'article_versions'
    AND indexname = 'idx_versions_post_date'
  ) THEN
    RAISE NOTICE 'Index idx_versions_post_date created successfully';
  END IF;
END $$;

-- Check if trigger exists
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM pg_trigger 
    WHERE tgname = 'auto_version_on_update'
  ) THEN
    RAISE NOTICE 'Trigger auto_version_on_update created successfully';
  END IF;
END $$;

-- Check if RLS is enabled
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'article_versions'
    AND rowsecurity = true
  ) THEN
    RAISE NOTICE 'RLS enabled on article_versions';
  ELSE
    RAISE WARNING 'RLS is not enabled on article_versions';
  END IF;
END $$;

-- ============================================================================
-- 7. SAMPLE DATA (for testing - optional)
-- ============================================================================
-- Uncomment to insert test data

/*
-- Insert a sample version manually
INSERT INTO article_versions (
  post_id,
  content,
  metadata,
  created_by
) VALUES (
  (SELECT id FROM blog_posts LIMIT 1), -- Use first blog post
  '[]'::jsonb,
  jsonb_build_object(
    'trigger', 'manual',
    'description', 'Test version'
  ),
  (SELECT user_id FROM blog_posts LIMIT 1)
);
*/

-- ============================================================================
-- 8. USAGE EXAMPLES
-- ============================================================================

-- Example 1: Get version history for a post
-- SELECT * FROM article_versions 
-- WHERE post_id = 'your-post-id-here'
-- ORDER BY created_at DESC;

-- Example 2: Get version count
-- SELECT get_version_count('your-post-id-here');

-- Example 3: Get latest version
-- SELECT * FROM get_latest_version('your-post-id-here');

-- Example 4: Cleanup old versions (keep last 20)
-- SELECT cleanup_old_versions('your-post-id-here', 20);

-- Example 5: Restore a version (manual operation)
-- UPDATE blog_posts
-- SET content = (
--   SELECT content FROM article_versions WHERE id = 'version-id-here'
-- )
-- WHERE id = 'post-id-here';

-- ============================================================================
-- 9. CLEANUP / ROLLBACK (if needed)
-- ============================================================================
-- Uncomment to remove all created objects

/*
DROP TRIGGER IF EXISTS auto_version_on_update ON blog_posts;
DROP FUNCTION IF EXISTS save_article_version();
DROP FUNCTION IF EXISTS get_version_count(UUID);
DROP FUNCTION IF EXISTS get_latest_version(UUID);
DROP FUNCTION IF EXISTS cleanup_old_versions(UUID, INTEGER);
DROP TABLE IF EXISTS article_versions CASCADE;
*/

-- ============================================================================
-- END OF SCRIPT
-- ============================================================================

-- Summary:
-- ✅ Created table: article_versions
-- ✅ Added 3 indexes for performance
-- ✅ Created auto-save trigger
-- ✅ Enabled RLS with 3 policies
-- ✅ Added 3 helper functions
-- ✅ Added verification checks

-- Next Steps:
-- 1. Run this script in Supabase SQL Editor
-- 2. Verify table creation in Table Editor
-- 3. Test by updating a blog post and checking versions
-- 4. Update Prisma schema to include article_versions model
