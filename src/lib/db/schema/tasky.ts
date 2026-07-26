import { pgTable, uuid, text, boolean, integer, jsonb, timestamp, index, primaryKey, unique } from 'drizzle-orm/pg-core';

// ─── User Profiles ───────────────────────────────────────────
export const userProfiles = pgTable('user_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  username: text('username').unique(),
  email: text('email').unique(),
  emailVerified: timestamp('email_verified', { withTimezone: true }),
  name: text('name'),
  image: text('image'),
  fullName: text('full_name'),
  avatarUrl: text('avatar_url'),
  website: text('website'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─── Workspaces ──────────────────────────────────────────────
export const workspaces = pgTable('workspaces', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => userProfiles.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  icon: text('icon'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('idx_workspaces_user').on(table.userId),
}));

// ─── Workspace Pages ─────────────────────────────────────────
export const workspacePages = pgTable('workspace_pages', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  parentId: uuid('parent_id').references((): any => workspacePages.id, { onDelete: 'cascade' }),
  title: text('title').default('Untitled').notNull(),
  content: jsonb('content'),
  icon: text('icon'),
  cover: jsonb('cover'),
  position: integer('position'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  workspaceIdx: index('idx_workspace_pages_workspace').on(table.workspaceId),
  parentIdx: index('idx_workspace_pages_parent').on(table.parentId),
}));

// ─── Blog Posts ──────────────────────────────────────────────
export const blogPosts = pgTable('blog_posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => userProfiles.id, { onDelete: 'cascade' }),
  parentId: uuid('parent_id').references((): any => blogPosts.id, { onDelete: 'cascade' }),
  title: text('title').default('Untitled').notNull(),
  content: jsonb('content'),
  icon: text('icon'),
  cover: jsonb('cover'),
  published: boolean('published').default(false),
  position: integer('position'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userIdx: index('idx_blog_posts_user').on(table.userId),
  parentIdx: index('idx_blog_posts_parent').on(table.parentId),
}));

// ─── Article Versions ────────────────────────────────────────
export const articleVersions = pgTable('article_versions', {
  id: uuid('id').primaryKey().defaultRandom(),
  postId: uuid('post_id').notNull().references(() => blogPosts.id, { onDelete: 'cascade' }),
  content: jsonb('content').notNull(),
  metadata: jsonb('metadata').default('{}'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  createdBy: uuid('created_by').references(() => userProfiles.id, { onDelete: 'set null' }),
}, (table) => ({
  postDateIdx: index('idx_versions_post_date').on(table.postId, table.createdAt),
  createdByIdx: index('idx_versions_user').on(table.createdBy),
}));

// ─── Task Boards ─────────────────────────────────────────────
export const taskBoards = pgTable('task_boards', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => userProfiles.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  icon: text('icon'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userIdx: index('idx_task_boards_user').on(table.userId),
}));

// ─── Task Columns ────────────────────────────────────────────
export const taskColumns = pgTable('task_columns', {
  id: uuid('id').primaryKey().defaultRandom(),
  boardId: uuid('board_id').notNull().references(() => taskBoards.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  position: integer('position'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  boardIdx: index('idx_task_columns_board').on(table.boardId),
}));

// ─── Tasks ───────────────────────────────────────────────────
export const tasks = pgTable('tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  boardId: uuid('board_id').notNull().references(() => taskBoards.id, { onDelete: 'cascade' }),
  columnId: uuid('column_id').references(() => taskColumns.id, { onDelete: 'set null' }),
  parentId: uuid('parent_id').references((): any => tasks.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  position: integer('position'),
  dueDate: timestamp('due_date', { withTimezone: true }),
  completed: boolean('completed').default(false),
  priority: integer('priority').default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  boardIdx: index('idx_tasks_board').on(table.boardId),
  columnIdx: index('idx_tasks_column').on(table.columnId),
  parentIdx: index('idx_tasks_parent').on(table.parentId),
}));

// ─── Task Tags ───────────────────────────────────────────────
export const taskTags = pgTable('task_tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  color: text('color'),
  userId: uuid('user_id').notNull().references(() => userProfiles.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userIdx: index('idx_task_tags_user').on(table.userId),
}));

// ─── Task Tag Assignments ────────────────────────────────────
export const taskTagAssignments = pgTable('task_tag_assignments', {
  taskId: uuid('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  tagId: uuid('tag_id').notNull().references(() => taskTags.id, { onDelete: 'cascade' }),
}, (table) => ({
  pk: primaryKey({ columns: [table.taskId, table.tagId] }),
  tagIdx: index('idx_tag_assignment_tag').on(table.tagId),
}));

// ─── Storage Files ───────────────────────────────────────────
export const storageFiles = pgTable('storage_files', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => userProfiles.id, { onDelete: 'cascade' }),
  bucketName: text('bucket_name').notNull(),
  filePath: text('file_path').notNull(),
  fileName: text('file_name').notNull(),
  fileSize: integer('file_size'),
  mimeType: text('mime_type'),
  entityType: text('entity_type'),
  entityId: uuid('entity_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userIdx: index('idx_storage_files_user').on(table.userId),
  entityIdx: index('idx_storage_files_entity').on(table.entityType, table.entityId),
}));

// ─── Chat Sessions ───────────────────────────────────────────
export const chatSessions = pgTable('chat_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => userProfiles.id, { onDelete: 'cascade' }),
  title: text('title').default('New Chat').notNull(),
  provider: text('provider').default('google').notNull(),
  model: text('model').default('gemini-2.5-flash').notNull(),
  temperature: integer('temperature').default(8),  // stored as integer (0-100), divided by 10 on read
  maxTokens: integer('max_tokens').default(1024),
  systemPrompt: text('system_prompt').default('You are a helpful AI assistant.'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userCreatedIdx: index('idx_chat_sessions_user_created').on(table.userId, table.createdAt),
}));

// ─── Chat Messages ───────────────────────────────────────────
export const chatMessages = pgTable('chat_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').notNull().references(() => chatSessions.id, { onDelete: 'cascade' }),
  role: text('role', { enum: ['user', 'assistant', 'system'] }).notNull(),
  content: text('content').notNull(),
  imageUrl: text('image_url'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  sessionCreatedIdx: index('idx_chat_messages_session_created').on(table.sessionId, table.createdAt),
}));

// ─── Documents ───────────────────────────────────────────────
export const documents = pgTable('documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => userProfiles.id, { onDelete: 'cascade' }),
  sessionId: uuid('session_id').references(() => chatSessions.id, { onDelete: 'set null' }),
  title: text('title').notNull(),
  content: text('content').notNull(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userCreatedIdx: index('idx_documents_user_created').on(table.userId, table.createdAt),
}));

// ─── Stories (user stories within documents) ─────────────────
export const stories = pgTable('stories', {
  id: uuid('id').primaryKey().defaultRandom(),
  documentId: uuid('document_id').notNull().references(() => documents.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description').notNull(),
  acceptance: text('acceptance'),
  priority: text('priority', { enum: ['low', 'medium', 'high', 'critical'] }).default('medium'),
  estimate: integer('estimate'),
  tags: text('tags').array().default([]),
  position: integer('position').default(0),
  exported: boolean('exported').default(false),
  exportedTo: text('exported_to'),
  externalId: text('external_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  documentPositionIdx: index('idx_stories_document_position').on(table.documentId, table.position),
}));

// ─── User AI Settings ────────────────────────────────────────
export const userAISettings = pgTable('user_ai_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().unique().references(() => userProfiles.id, { onDelete: 'cascade' }),
  defaultProvider: text('default_provider').default('google').notNull(),
  defaultModel: text('default_model').default('gemini-2.5-flash').notNull(),
  temperature: integer('temperature').default(8),
  maxTokens: integer('max_tokens').default(1024),
  systemPrompt: text('system_prompt').default('You are a helpful AI assistant.'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─── User API Keys ───────────────────────────────────────────
export const userAPIKeys = pgTable('user_api_keys', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => userProfiles.id, { onDelete: 'cascade' }),
  provider: text('provider').notNull(),
  keyEncrypted: text('key_encrypted').notNull(),
  iv: text('iv').notNull(),
  authTag: text('auth_tag').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userProviderUnique: unique('uq_user_api_keys_provider').on(table.userId, table.provider),
  userIdx: index('idx_user_api_keys_user').on(table.userId),
}));

// ─── Model Test Results ──────────────────────────────────────
export const modelTestResults = pgTable('model_test_results', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => userProfiles.id, { onDelete: 'cascade' }),
  modelId: text('model_id').notNull(),
  success: boolean('success').notNull(),
  testedAt: timestamp('tested_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userModelUnique: unique('uq_model_test_results_user_model').on(table.userId, table.modelId),
  userIdx: index('idx_model_test_results_user').on(table.userId),
}));

// ─── Export Configs (Jira/Trello) ────────────────────────────
export const exportConfigs = pgTable('export_configs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => userProfiles.id, { onDelete: 'cascade' }),
  platform: text('platform').notNull(),
  accessToken: text('access_token').notNull(),
  refreshToken: text('refresh_token'),
  workspace: text('workspace'),
  boardId: text('board_id'),
  projectKey: text('project_key'),
  listId: text('list_id'),
  issueType: text('issue_type').default('Story'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userPlatformUnique: unique('uq_export_configs_platform').on(table.userId, table.platform),
  userIdx: index('idx_export_configs_user').on(table.userId),
}));

// ─── Workspace (multi-space, previously separate model) ──────
// Already covered by workspaces table above
