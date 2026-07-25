import { pgTable, uuid, text, integer, jsonb, timestamp, boolean, index, unique } from 'drizzle-orm/pg-core';

// ─── Stories Projects ────────────────────────────────────────
export const storiesProjects = pgTable('stories_projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  platform: text('platform', { enum: ['jira', 'trello'] }).notNull(),
  platformProjectId: text('platform_project_id').notNull(),
  projectName: text('project_name').notNull(),
  googleAccountEmail: text('google_account_email').notNull(),
  connectionStatus: text('connection_status', { enum: ['connected', 'disconnected', 'error'] }).default('connected').notNull(),
  platformCredentials: jsonb('platform_credentials'),
  projectMetadata: jsonb('project_metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userPlatformProjectUnique: unique('uq_stories_projects_user_platform').on(table.userId, table.platform, table.platformProjectId),
  userPlatformIdx: index('idx_stories_projects_user_platform').on(table.userId, table.platform),
  statusIdx: index('idx_stories_projects_status').on(table.connectionStatus),
}));

// ─── Stories Documents ───────────────────────────────────────
export const storiesDocuments = pgTable('stories_documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').notNull().references(() => storiesProjects.id, { onDelete: 'cascade' }),
  documentType: text('document_type', { enum: ['report', 'stories'] }).notNull(),
  fileName: text('file_name').notNull(),
  title: text('title').notNull(),
  content: jsonb('content').default('[]').notNull(),
  metadata: jsonb('metadata'),
  lastSyncedAt: timestamp('last_synced_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  projectTypeUnique: unique('uq_stories_documents_project_type').on(table.projectId, table.documentType),
  projectTypeIdx: index('idx_stories_documents_project_type').on(table.projectId, table.documentType),
  updatedIdx: index('idx_stories_documents_updated').on(table.updatedAt),
}));

// ─── Stories Sync History ────────────────────────────────────
export const storiesSyncHistory = pgTable('stories_sync_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  documentId: uuid('document_id').notNull().references(() => storiesDocuments.id, { onDelete: 'cascade' }),
  syncDirection: text('sync_direction', { enum: ['to_platform', 'from_platform'] }).notNull(),
  platform: text('platform', { enum: ['jira', 'trello'] }).notNull(),
  syncStatus: text('sync_status', { enum: ['success', 'partial', 'failed'] }).notNull(),
  itemsSynced: integer('items_synced').default(0),
  itemsFailed: integer('items_failed').default(0),
  syncDetails: jsonb('sync_details'),
  errorMessage: text('error_message'),
  startedAt: timestamp('started_at', { withTimezone: true }).defaultNow().notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
}, (table) => ({
  documentDateIdx: index('idx_stories_sync_history_document_date').on(table.documentId, table.startedAt),
  statusIdx: index('idx_stories_sync_history_status').on(table.syncStatus),
}));

// ─── Stories Platform Connections ────────────────────────────
export const storiesPlatformConnections = pgTable('stories_platform_connections', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  platform: text('platform', { enum: ['jira', 'trello', 'google'] }).notNull(),
  googleAccountEmail: text('google_account_email').notNull(),
  platformUserId: text('platform_user_id'),
  platformUsername: text('platform_username'),
  accessTokenEncrypted: text('access_token_encrypted'),
  refreshTokenEncrypted: text('refresh_token_encrypted'),
  tokenExpiresAt: timestamp('token_expires_at', { withTimezone: true }),
  connectionStatus: text('connection_status', { enum: ['connected', 'disconnected', 'expired', 'error'] }).default('connected').notNull(),
  lastVerifiedAt: timestamp('last_verified_at', { withTimezone: true }).defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userPlatformEmailUnique: unique('uq_stories_connections_user_platform').on(table.userId, table.platform, table.googleAccountEmail),
  userPlatformIdx: index('idx_stories_platform_connections_user_platform').on(table.userId, table.platform),
  statusIdx: index('idx_stories_platform_connections_status').on(table.connectionStatus),
  emailIdx: index('idx_stories_platform_connections_email').on(table.googleAccountEmail),
}));

// ─── User Platform Configs ───────────────────────────────────
export const userPlatformConfigs = pgTable('user_platform_configs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  platform: text('platform', { enum: ['jira', 'trello'] }).notNull(),
  jiraUrl: text('jira_url'),
  jiraEmail: text('jira_email'),
  jiraApiTokenEncrypted: text('jira_api_token_encrypted'),
  jiraProjectKey: text('jira_project_key'),
  trelloKeyEncrypted: text('trello_key_encrypted'),
  trelloTokenEncrypted: text('trello_token_encrypted'),
  trelloBoardId: text('trello_board_id'),
  isActive: boolean('is_active').default(true),
  configName: text('config_name').default('Default'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userPlatformConfigUnique: unique('uq_user_platform_config').on(table.userId, table.platform, table.configName),
  userPlatformIdx: index('idx_user_platform_configs_user_platform').on(table.userId, table.platform),
  activeIdx: index('idx_user_platform_configs_active').on(table.userId, table.isActive),
}));
