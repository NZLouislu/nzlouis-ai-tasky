-- stories_sync_history RLS policies-- Stories Feature Database Schema Migration
-- Run this in Supabase SQL Editor

-- ============================================
-- Stories Feature Database Schema (Fixed Version)
-- Create database table structure for Stories feature
-- Remove foreign key constraints to avoid type mismatch issues
-- ============================================

-- 1. Create stories_projects table - Store project information
CREATE TABLE IF NOT EXISTS stories_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  platform VARCHAR(20) NOT NULL CHECK (platform IN ('jira', 'trello')),
  platform_project_id VARCHAR(255) NOT NULL,
  project_name VARCHAR(255) NOT NULL,
  google_account_email VARCHAR(255) NOT NULL,
  connection_status VARCHAR(20) NOT NULL DEFAULT 'connected' CHECK (connection_status IN ('connected', 'disconnected', 'error')),
  platform_credentials JSONB, -- Store encrypted platform credentials
  project_metadata JSONB, -- Store platform-specific project metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_user_platform_project UNIQUE (user_id, platform, platform_project_id)
);

-- 2. Create stories_documents table - Store document content
CREATE TABLE IF NOT EXISTS stories_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,
  document_type VARCHAR(20) NOT NULL CHECK (document_type IN ('report', 'stories')),
  file_name VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  content JSONB NOT NULL DEFAULT '[]', -- BlockNote format content
  metadata JSONB, -- Document metadata
  last_synced_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_stories_documents_project FOREIGN KEY (project_id) 
    REFERENCES stories_projects(id) ON DELETE CASCADE,
  CONSTRAINT unique_project_document_type UNIQUE (project_id, document_type)
);

-- 3. Create stories_sync_history table - Record sync history
CREATE TABLE IF NOT EXISTS stories_sync_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL,
  sync_direction VARCHAR(20) NOT NULL CHECK (sync_direction IN ('to_platform', 'from_platform')),
  platform VARCHAR(20) NOT NULL CHECK (platform IN ('jira', 'trello')),
  sync_status VARCHAR(20) NOT NULL CHECK (sync_status IN ('success', 'partial', 'failed')),
  items_synced INTEGER DEFAULT 0,
  items_failed INTEGER DEFAULT 0,
  sync_details JSONB, -- Detailed sync results
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT fk_stories_sync_history_document FOREIGN KEY (document_id) 
    REFERENCES stories_documents(id) ON DELETE CASCADE
);

-- 4. Create stories_platform_connections table - Store platform connection information
CREATE TABLE IF NOT EXISTS stories_platform_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  platform VARCHAR(20) NOT NULL CHECK (platform IN ('jira', 'trello', 'google')),
  google_account_email VARCHAR(255) NOT NULL,
  platform_user_id VARCHAR(255),
  platform_username VARCHAR(255),
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  connection_status VARCHAR(20) NOT NULL DEFAULT 'connected' CHECK (connection_status IN ('connected', 'disconnected', 'expired', 'error')),
  last_verified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_user_platform_email UNIQUE (user_id, platform, google_account_email)
);

-- ============================================
-- Create indexes to optimize query performance
-- ============================================

-- stories_projects indexes
CREATE INDEX IF NOT EXISTS idx_stories_projects_user_platform 
  ON stories_projects(user_id, platform);

CREATE INDEX IF NOT EXISTS idx_stories_projects_status 
  ON stories_projects(connection_status);

-- stories_documents indexes
CREATE INDEX IF NOT EXISTS idx_stories_documents_project_type 
  ON stories_documents(project_id, document_type);

CREATE INDEX IF NOT EXISTS idx_stories_documents_updated 
  ON stories_documents(updated_at DESC);

-- stories_sync_history indexes
CREATE INDEX IF NOT EXISTS idx_stories_sync_history_document_date 
  ON stories_sync_history(document_id, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_stories_sync_history_status 
  ON stories_sync_history(sync_status);

-- stories_platform_connections indexes
CREATE INDEX IF NOT EXISTS idx_stories_platform_connections_user_platform 
  ON stories_platform_connections(user_id, platform);

CREATE INDEX IF NOT EXISTS idx_stories_platform_connections_status 
  ON stories_platform_connections(connection_status);

CREATE INDEX IF NOT EXISTS idx_stories_platform_connections_email 
  ON stories_platform_connections(google_account_email);

-- ============================================
-- Enable Row Level Security (RLS) policies
-- ============================================

-- Enable RLS
ALTER TABLE stories_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories_sync_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories_platform_connections ENABLE ROW LEVEL SECURITY;

-- stories_projects RLS policies
DROP POLICY IF EXISTS "Users can access their own stories projects" ON stories_projects;
CREATE POLICY "Users can access their own stories projects"
ON stories_projects
FOR ALL
TO authenticated
USING (user_id = auth.uid()::text);

-- stories_documents RLS policies
DROP POLICY IF EXISTS "Users can access their own stories documents" ON stories_documents;
CREATE POLICY "Users can access their own stories documents"
ON stories_documents
FOR ALL
TO authenticated
USING (
  project_id IN (
    SELECT id FROM stories_projects WHERE user_id = auth.uid()::text
  )
);

-- stories_sync_history RLS policies
DROP POLICY IF EXISTS "Users can access their own sync history" ON stories_sync_history;
CREATE POLICY "Users can access their own sync history"
ON stories_sync_history
FOR ALL
TO authenticated
USING (
  document_id IN (
    SELECT sd.id FROM stories_documents sd
    JOIN stories_projects sp ON sd.project_id = sp.id
    WHERE sp.user_id = auth.uid()::text
  )
);

-- stories_platform_connections RLS policies
DROP POLICY IF EXISTS "Users can access their own platform connections" ON stories_platform_connections;
CREATE POLICY "Users can access their own platform connections"
ON stories_platform_connections
FOR ALL
TO authenticated
USING (user_id = auth.uid()::text);

-- ============================================
-- Grant permissions
-- ============================================

GRANT ALL ON stories_projects TO anon, authenticated, service_role;
GRANT ALL ON stories_documents TO anon, authenticated, service_role;
GRANT ALL ON stories_sync_history TO anon, authenticated, service_role;
GRANT ALL ON stories_platform_connections TO anon, authenticated, service_role;