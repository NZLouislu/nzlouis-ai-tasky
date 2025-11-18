-- SQL to create all tables in Supabase for Workspaces, Blogs, and Tasks
-- Run this in your Supabase SQL editor

-- Drop existing tables if they exist (in reverse order of dependencies)
DROP TABLE IF EXISTS storage_files;
DROP TABLE IF EXISTS task_tag_assignments;
DROP TABLE IF EXISTS task_tags;
DROP TABLE IF EXISTS tasks;
DROP TABLE IF EXISTS task_columns;
DROP TABLE IF EXISTS task_boards;
DROP TABLE IF EXISTS blog_posts;
DROP TABLE IF EXISTS workspace_pages;
DROP TABLE IF EXISTS workspaces;
DROP TABLE IF EXISTS user_profiles;
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- User profiles table
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id), -- Reference to Supabase auth user
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  website TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trigger for user_profiles
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Workspaces table
CREATE TABLE workspaces (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL, -- User reference
  name TEXT NOT NULL,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trigger for workspaces
CREATE TRIGGER update_workspaces_updated_at
    BEFORE UPDATE ON workspaces
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Workspace pages table
CREATE TABLE workspace_pages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES workspace_pages(id) ON DELETE CASCADE, -- For hierarchical structure
  title TEXT NOT NULL DEFAULT 'Untitled',
  content JSONB, -- Store page content as JSON
  icon TEXT,
  cover JSONB, -- Store cover information (color or image)
  position INTEGER, -- For page ordering
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trigger for workspace_pages
CREATE TRIGGER update_workspace_pages_updated_at
    BEFORE UPDATE ON workspace_pages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Blog posts table
CREATE TABLE blog_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL, -- User reference
  parent_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE, -- For hierarchical structure
  title TEXT NOT NULL DEFAULT 'Untitled',
  content JSONB, -- Store post content as JSON
  icon TEXT,
  cover JSONB, -- Store cover information (color or image)
  published BOOLEAN DEFAULT false, -- Draft vs Published status
  position INTEGER, -- For post ordering
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trigger for blog_posts
CREATE TRIGGER update_blog_posts_updated_at
    BEFORE UPDATE ON blog_posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Task boards table
CREATE TABLE task_boards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL, -- User reference
  name TEXT NOT NULL,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trigger for task_boards
CREATE TRIGGER update_task_boards_updated_at
    BEFORE UPDATE ON task_boards
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Task columns table
CREATE TABLE task_columns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  board_id UUID NOT NULL REFERENCES task_boards(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  position INTEGER, -- For column ordering
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trigger for task_columns
CREATE TRIGGER update_task_columns_updated_at
    BEFORE UPDATE ON task_columns
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Tasks table
CREATE TABLE tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  board_id UUID NOT NULL REFERENCES task_boards(id) ON DELETE CASCADE,
  column_id UUID REFERENCES task_columns(id) ON DELETE SET NULL,
  parent_id UUID REFERENCES tasks(id) ON DELETE CASCADE, -- For subtasks
  title TEXT NOT NULL,
  description TEXT,
  position INTEGER, -- For task ordering
  due_date TIMESTAMP WITH TIME ZONE,
  completed BOOLEAN DEFAULT false,
  priority INTEGER DEFAULT 0, -- Task priority
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trigger for tasks
CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Task tags table
CREATE TABLE task_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT, -- Tag color
  user_id UUID NOT NULL, -- User reference
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Task tag assignments table
CREATE TABLE task_tag_assignments (
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES task_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, tag_id)
);

-- Storage files table
CREATE TABLE storage_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL, -- User reference
  bucket_name TEXT NOT NULL, -- Bucket name
  file_path TEXT NOT NULL, -- File path
  file_name TEXT NOT NULL, -- Original file name
  file_size INTEGER, -- File size (bytes)
  mime_type TEXT, -- MIME type
  entity_type TEXT, -- Associated entity type (workspace_page, blog_post, task, etc.)
  entity_id UUID, -- Associated entity ID
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);