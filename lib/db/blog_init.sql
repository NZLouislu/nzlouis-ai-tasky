-- SQL to create all tables in Supabase
-- Run this in your Supabase SQL editor

-- Drop existing tables if they exist
DROP TABLE IF EXISTS daily_stats;
DROP TABLE IF EXISTS post_stats;
DROP TABLE IF EXISTS comments;
DROP TABLE IF EXISTS feature_toggles;

-- Create feature_toggles table
CREATE TABLE feature_toggles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  total_views BOOLEAN DEFAULT true,
  total_likes BOOLEAN DEFAULT true,
  total_comments BOOLEAN DEFAULT true,
  ai_summaries BOOLEAN DEFAULT true,
  ai_questions BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default values for feature_toggles
INSERT INTO feature_toggles (total_views, total_likes, total_comments, ai_summaries, ai_questions)
VALUES (true, true, true, true, true);

-- Create updated_at trigger function (drop if exists first)
DROP FUNCTION IF EXISTS update_updated_at_column();

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for feature_toggles
DROP TRIGGER IF EXISTS update_feature_toggles_updated_at ON feature_toggles;

CREATE TRIGGER update_feature_toggles_updated_at
    BEFORE UPDATE ON feature_toggles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create comments table
CREATE TABLE comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id TEXT NOT NULL,
  name TEXT,
  email TEXT,
  comment TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create post_stats table
CREATE TABLE post_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id TEXT UNIQUE NOT NULL,
  title TEXT DEFAULT 'Blog Post',
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  ai_questions INTEGER DEFAULT 0,
  ai_summaries INTEGER DEFAULT 0
);

-- Create daily_stats table
CREATE TABLE daily_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id TEXT NOT NULL,
  date DATE NOT NULL,
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  ai_questions INTEGER DEFAULT 0,
  ai_summaries INTEGER DEFAULT 0,
  UNIQUE(post_id, date)
);