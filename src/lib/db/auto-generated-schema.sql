-- ============================================
-- Complete Database Structure (Auto-generated)
-- Generated at: 2025-11-08T22:06:33.941Z
-- ============================================

-- ============================================
-- 3. Primary Key Constraints
-- ============================================

-- blog_posts.id (blog_posts_pkey)
-- storage_files.id (storage_files_pkey)
-- task_boards.id (task_boards_pkey)
-- task_columns.id (task_columns_pkey)
-- task_tag_assignments.task_id (task_tag_assignments_pkey)
-- task_tag_assignments.tag_id (task_tag_assignments_pkey)
-- task_tags.id (task_tags_pkey)
-- tasks.id (tasks_pkey)
-- user_profiles.id (user_profiles_pkey)
-- workspace_pages.id (workspace_pages_pkey)
-- workspaces.id (workspaces_pkey)

-- ============================================
-- 4. Foreign Key Constraints
-- ============================================

-- blog_posts.parent_id → blog_posts.id
--   (blog_posts_parent_id_fkey)
-- task_columns.board_id → task_boards.id
--   (task_columns_board_id_fkey)
-- task_tag_assignments.task_id → tasks.id
--   (task_tag_assignments_task_id_fkey)
-- task_tag_assignments.tag_id → task_tags.id
--   (task_tag_assignments_tag_id_fkey)
-- tasks.board_id → task_boards.id
--   (tasks_board_id_fkey)
-- tasks.column_id → task_columns.id
--   (tasks_column_id_fkey)
-- tasks.parent_id → tasks.id
--   (tasks_parent_id_fkey)
-- workspace_pages.workspace_id → workspaces.id
--   (workspace_pages_workspace_id_fkey)
-- workspace_pages.parent_id → workspace_pages.id
--   (workspace_pages_parent_id_fkey)

-- ============================================
-- 5. Indexes
-- ============================================

-- blog_posts.blog_posts_pkey
--   CREATE UNIQUE INDEX blog_posts_pkey ON public.blog_posts USING btree (id)

-- storage_files.storage_files_pkey
--   CREATE UNIQUE INDEX storage_files_pkey ON public.storage_files USING btree (id)

-- task_boards.task_boards_pkey
--   CREATE UNIQUE INDEX task_boards_pkey ON public.task_boards USING btree (id)

-- task_columns.task_columns_pkey
--   CREATE UNIQUE INDEX task_columns_pkey ON public.task_columns USING btree (id)

-- task_tag_assignments.task_tag_assignments_pkey
--   CREATE UNIQUE INDEX task_tag_assignments_pkey ON public.task_tag_assignments USING btree (task_id, tag_id)

-- task_tags.task_tags_pkey
--   CREATE UNIQUE INDEX task_tags_pkey ON public.task_tags USING btree (id)

-- tasks.tasks_pkey
--   CREATE UNIQUE INDEX tasks_pkey ON public.tasks USING btree (id)

-- user_profiles.user_profiles_pkey
--   CREATE UNIQUE INDEX user_profiles_pkey ON public.user_profiles USING btree (id)

-- user_profiles.user_profiles_username_key
--   CREATE UNIQUE INDEX user_profiles_username_key ON public.user_profiles USING btree (username)

-- workspace_pages.workspace_pages_pkey
--   CREATE UNIQUE INDEX workspace_pages_pkey ON public.workspace_pages USING btree (id)

-- workspaces.workspaces_pkey
--   CREATE UNIQUE INDEX workspaces_pkey ON public.workspaces USING btree (id)

-- ============================================
-- 6. Unique Constraints
-- ============================================

-- user_profiles.username (user_profiles_username_key)

-- ============================================
-- 8. Table Row Counts
-- ============================================

-- workspace_pages: 0 rows
-- workspaces: 0 rows
-- task_columns: 0 rows
-- task_boards: 0 rows
-- storage_files: 0 rows
-- tasks: 0 rows
-- task_tag_assignments: 0 rows
-- task_tags: 0 rows
-- blog_posts: 0 rows
-- user_profiles: 0 rows
