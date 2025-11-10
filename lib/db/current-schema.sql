-- ============================================
-- Supabase 数据库当前结构
-- 最后更新: 等待从截图识别
-- ============================================

-- 说明：
-- 此文件记录 Supabase Tasky 数据库的完整结构
-- 包括所有表、列、约束、索引和关系
-- 通过执行 scripts/get-supabase-schema.sql 中的查询获得

-- ============================================
-- 1. 所有表列表
-- ============================================
-- 查询时间: 2025-01-08
-- 共 10 个表

/*
table_name              | table_type
------------------------|------------
blog_posts              | BASE TABLE
storage_files           | BASE TABLE
task_boards             | BASE TABLE
task_columns            | BASE TABLE
task_tag_assignments    | BASE TABLE
task_tags               | BASE TABLE
tasks                   | BASE TABLE
user_profiles           | BASE TABLE
workspace_pages         | BASE TABLE
workspaces              | BASE TABLE
*/

-- 表分类：
-- 博客相关: blog_posts
-- 存储相关: storage_files
-- 任务管理: task_boards, task_columns, task_tag_assignments, task_tags, tasks
-- 用户相关: user_profiles
-- 工作区相关: workspaces, workspace_pages


-- ============================================
-- 2. 表的列信息
-- ============================================
-- 查询时间: 2025-01-08
-- 共 75 列

-- blog_posts (11 列)
-- id                uuid              NOT NULL  DEFAULT gen_random_uuid()
-- user_id           uuid              NOT NULL
-- parent_id         uuid              YES
-- title             text              NOT NULL  DEFAULT 'Untitled'::text
-- content           jsonb             YES
-- icon              text              YES
-- cover             jsonb             YES
-- published         boolean           YES       DEFAULT false
-- position          integer           YES
-- created_at        timestamp with time zone  YES  DEFAULT now()
-- updated_at        timestamp with time zone  YES  DEFAULT now()

-- storage_files (8 列)
-- id                uuid              NOT NULL  DEFAULT gen_random_uuid()
-- user_id           uuid              NOT NULL
-- bucket_name       text              NOT NULL
-- file_path         text              NOT NULL
-- file_name         text              NOT NULL
-- file_size         integer           YES
-- mime_type         text              YES
-- entity_type       text              YES
-- entity_id         uuid              YES
-- created_at        timestamp with time zone  YES  DEFAULT now()

-- task_boards (6 列)
-- id                uuid              NOT NULL  DEFAULT gen_random_uuid()
-- user_id           uuid              NOT NULL
-- name              text              NOT NULL
-- icon              text              YES
-- created_at        timestamp with time zone  YES  DEFAULT now()
-- updated_at        timestamp with time zone  YES  DEFAULT now()

-- task_columns (5 列)
-- id                uuid              NOT NULL  DEFAULT gen_random_uuid()
-- board_id          uuid              NOT NULL
-- name              text              NOT NULL
-- position          integer           YES
-- created_at        timestamp with time zone  YES  DEFAULT now()
-- updated_at        timestamp with time zone  YES  DEFAULT now()

-- task_tag_assignments (2 列)
-- task_id           uuid              NOT NULL
-- tag_id            uuid              NOT NULL

-- task_tags (5 列)
-- id                uuid              NOT NULL  DEFAULT gen_random_uuid()
-- name              text              NOT NULL
-- color             text              YES
-- user_id           uuid              NOT NULL
-- created_at        timestamp with time zone  YES  DEFAULT now()

-- tasks (10 列)
-- id                uuid              NOT NULL  DEFAULT gen_random_uuid()
-- board_id          uuid              NOT NULL
-- column_id         uuid              YES
-- parent_id         uuid              YES
-- title             text              NOT NULL
-- description       text              YES
-- position          integer           YES
-- due_date          timestamp with time zone  YES
-- completed         boolean           YES       DEFAULT false
-- priority          integer           YES       DEFAULT 0
-- created_at        timestamp with time zone  YES  DEFAULT now()
-- updated_at        timestamp with time zone  YES  DEFAULT now()

-- user_profiles (6 列)
-- id                uuid              NOT NULL
-- username          text              YES
-- full_name         text              YES
-- avatar_url        text              YES
-- website           text              YES
-- created_at        timestamp with time zone  YES  DEFAULT now()
-- updated_at        timestamp with time zone  YES  DEFAULT now()

-- workspace_pages (10 列)
-- id                uuid              NOT NULL  DEFAULT gen_random_uuid()
-- workspace_id      uuid              NOT NULL
-- parent_id         uuid              YES
-- title             text              NOT NULL  DEFAULT 'Untitled'::text
-- content           jsonb             YES
-- icon              text              YES
-- cover             jsonb             YES
-- position          integer           YES
-- created_at        timestamp with time zone  YES  DEFAULT now()
-- updated_at        timestamp with time zone  YES  DEFAULT now()

-- workspaces (6 列)
-- id                uuid              NOT NULL  DEFAULT gen_random_uuid()
-- user_id           uuid              NOT NULL
-- name              text              NOT NULL
-- icon              text              YES
-- created_at        timestamp with time zone  YES  DEFAULT now()
-- updated_at        timestamp with time zone  YES  DEFAULT now()


-- ============================================
-- 3. 主键约束
-- ============================================
-- 执行查询 3 后，从截图识别并填充
-- 等待截图...


-- ============================================
-- 4. 外键约束
-- ============================================
-- 执行查询 4 后，从截图识别并填充
-- 等待截图...


-- ============================================
-- 5. 索引
-- ============================================
-- 执行查询 5 后，从截图识别并填充
-- 等待截图...


-- ============================================
-- 6. 唯一约束
-- ============================================
-- 执行查询 6 后，从截图识别并填充
-- 等待截图...


-- ============================================
-- 7. CREATE TABLE 语句
-- ============================================
-- 执行查询 7 后，从截图识别并填充
-- 等待截图...


-- ============================================
-- 8. 表的行数统计
-- ============================================
-- 执行查询 8 后，从截图识别并填充
-- 等待截图...


-- ============================================
-- 现有 Prisma Schema 对比分析
-- ============================================

/*
对比结果：Prisma Schema 与数据库实际结构的差异

1. 表名映射差异：
   Prisma Model          → Database Table
   ----------------        ------------------
   User                  → user_profiles ❌ 不匹配！
   Workspace             → workspaces ✅
   WorkspacePage         → workspace_pages ✅
   BlogPost              → blog_posts ✅
   TaskBoard             → task_boards ✅
   TaskColumn            → task_columns ✅
   Task                  → tasks ✅
   TaskTag               → task_tags ✅
   TaskTagAssignment     → task_tag_assignments ✅
   StorageFile           → storage_files ✅

2. 关键问题：
   ❌ Prisma 中的 User 模型对应数据库中的 user_profiles 表
   ❌ 需要在 Prisma 中添加 @@map("user_profiles")

3. 列名差异：
   - Prisma 使用 camelCase: userId, fullName, avatarUrl
   - 数据库使用 snake_case: user_id, full_name, avatar_url
   - Prisma 会自动处理这个映射

4. 缺失的列：
   - user_profiles.updated_at 在 Prisma 中已定义 ✅
   - storage_files 缺少 entity_type 和 entity_id 在数据库中存在 ✅

建议的 Prisma Schema 修正：
*/

-- ============================================
-- 修正后的 Prisma Schema（推荐）
-- ============================================

/*
// 修正 User 模型，添加 @@map
model User {
  id            String     @id @default(uuid())
  username      String?    @unique
  fullName      String?    @map("full_name")
  avatarUrl     String?    @map("avatar_url")
  website       String?
  createdAt     DateTime   @default(now()) @map("created_at")
  updatedAt     DateTime   @updatedAt @map("updated_at")
  
  workspaces    Workspace[]
  blogPosts     BlogPost[]
  taskBoards    TaskBoard[]
  taskTags      TaskTag[]
  storageFiles  StorageFile[]
  
  @@map("user_profiles")
}

// 其他模型保持不变，但需要添加列映射
model Workspace {
  id            String          @id @default(uuid())
  userId        String          @map("user_id")
  user          User            @relation(fields: [userId], references: [id])
  name          String
  icon          String?
  createdAt     DateTime        @default(now()) @map("created_at")
  updatedAt     DateTime        @updatedAt @map("updated_at")
  workspacePages WorkspacePage[]
}

// ... 其他模型类似添加 @map 映射
*/
