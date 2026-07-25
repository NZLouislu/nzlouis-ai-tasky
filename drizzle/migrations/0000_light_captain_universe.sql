CREATE TABLE "comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" text NOT NULL,
	"name" text,
	"email" text,
	"comment" text NOT NULL,
	"is_anonymous" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "daily_stats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" text NOT NULL,
	"date" date NOT NULL,
	"views" integer DEFAULT 0,
	"likes" integer DEFAULT 0,
	"ai_questions" integer DEFAULT 0,
	"ai_summaries" integer DEFAULT 0,
	CONSTRAINT "uq_daily_stats_post_date" UNIQUE("post_id","date")
);
--> statement-breakpoint
CREATE TABLE "feature_toggles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"total_views" boolean DEFAULT true,
	"total_likes" boolean DEFAULT true,
	"total_comments" boolean DEFAULT true,
	"ai_summaries" boolean DEFAULT true,
	"ai_questions" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "post_stats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" text NOT NULL,
	"title" text DEFAULT 'Blog Post',
	"views" integer DEFAULT 0,
	"likes" integer DEFAULT 0,
	"ai_questions" integer DEFAULT 0,
	"ai_summaries" integer DEFAULT 0,
	CONSTRAINT "post_stats_post_id_unique" UNIQUE("post_id")
);
--> statement-breakpoint
CREATE TABLE "stories_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"document_type" text NOT NULL,
	"file_name" text NOT NULL,
	"title" text NOT NULL,
	"content" jsonb DEFAULT '[]' NOT NULL,
	"metadata" jsonb,
	"last_synced_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_stories_documents_project_type" UNIQUE("project_id","document_type")
);
--> statement-breakpoint
CREATE TABLE "stories_platform_connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"platform" text NOT NULL,
	"google_account_email" text NOT NULL,
	"platform_user_id" text,
	"platform_username" text,
	"access_token_encrypted" text,
	"refresh_token_encrypted" text,
	"token_expires_at" timestamp with time zone,
	"connection_status" text DEFAULT 'connected' NOT NULL,
	"last_verified_at" timestamp with time zone DEFAULT now(),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_stories_connections_user_platform" UNIQUE("user_id","platform","google_account_email")
);
--> statement-breakpoint
CREATE TABLE "stories_projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"platform" text NOT NULL,
	"platform_project_id" text NOT NULL,
	"project_name" text NOT NULL,
	"google_account_email" text NOT NULL,
	"connection_status" text DEFAULT 'connected' NOT NULL,
	"platform_credentials" jsonb,
	"project_metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_stories_projects_user_platform" UNIQUE("user_id","platform","platform_project_id")
);
--> statement-breakpoint
CREATE TABLE "stories_sync_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"sync_direction" text NOT NULL,
	"platform" text NOT NULL,
	"sync_status" text NOT NULL,
	"items_synced" integer DEFAULT 0,
	"items_failed" integer DEFAULT 0,
	"sync_details" jsonb,
	"error_message" text,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "user_platform_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"platform" text NOT NULL,
	"jira_url" text,
	"jira_email" text,
	"jira_api_token_encrypted" text,
	"jira_project_key" text,
	"trello_key_encrypted" text,
	"trello_token_encrypted" text,
	"trello_board_id" text,
	"is_active" boolean DEFAULT true,
	"config_name" text DEFAULT 'Default',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_user_platform_config" UNIQUE("user_id","platform","config_name")
);
--> statement-breakpoint
CREATE TABLE "article_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" uuid NOT NULL,
	"content" jsonb NOT NULL,
	"metadata" jsonb DEFAULT '{}',
	"created_at" timestamp with time zone DEFAULT now(),
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "blog_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"parent_id" uuid,
	"title" text DEFAULT 'Untitled' NOT NULL,
	"content" jsonb,
	"icon" text,
	"cover" jsonb,
	"published" boolean DEFAULT false,
	"position" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"image_url" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text DEFAULT 'New Chat' NOT NULL,
	"provider" text DEFAULT 'google' NOT NULL,
	"model" text DEFAULT 'gemini-2.5-flash' NOT NULL,
	"temperature" integer DEFAULT 8,
	"max_tokens" integer DEFAULT 1024,
	"system_prompt" text DEFAULT 'You are a helpful AI assistant.',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"session_id" uuid,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "export_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"platform" text NOT NULL,
	"access_token" text NOT NULL,
	"refresh_token" text,
	"workspace" text,
	"board_id" text,
	"project_key" text,
	"list_id" text,
	"issue_type" text DEFAULT 'Story',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_export_configs_platform" UNIQUE("user_id","platform")
);
--> statement-breakpoint
CREATE TABLE "storage_files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"bucket_name" text NOT NULL,
	"file_path" text NOT NULL,
	"file_name" text NOT NULL,
	"file_size" integer,
	"mime_type" text,
	"entity_type" text,
	"entity_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"acceptance" text,
	"priority" text DEFAULT 'medium',
	"estimate" integer,
	"tags" text[] DEFAULT '{}',
	"position" integer DEFAULT 0,
	"exported" boolean DEFAULT false,
	"exported_to" text,
	"external_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_boards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"icon" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_columns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"board_id" uuid NOT NULL,
	"name" text NOT NULL,
	"position" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_tag_assignments" (
	"task_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	CONSTRAINT "task_tag_assignments_task_id_tag_id_pk" PRIMARY KEY("task_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "task_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"color" text,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"board_id" uuid NOT NULL,
	"column_id" uuid,
	"parent_id" uuid,
	"title" text NOT NULL,
	"description" text,
	"position" integer,
	"due_date" timestamp with time zone,
	"completed" boolean DEFAULT false,
	"priority" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_ai_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"default_provider" text DEFAULT 'google' NOT NULL,
	"default_model" text DEFAULT 'gemini-2.5-flash' NOT NULL,
	"temperature" integer DEFAULT 8,
	"max_tokens" integer DEFAULT 1024,
	"system_prompt" text DEFAULT 'You are a helpful AI assistant.',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_ai_settings_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "user_api_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"key_encrypted" text NOT NULL,
	"iv" text NOT NULL,
	"auth_tag" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_user_api_keys_provider" UNIQUE("user_id","provider")
);
--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text,
	"email" text,
	"email_verified" timestamp with time zone,
	"name" text,
	"image" text,
	"full_name" text,
	"avatar_url" text,
	"website" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_profiles_username_unique" UNIQUE("username"),
	CONSTRAINT "user_profiles_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "workspace_pages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"parent_id" uuid,
	"title" text DEFAULT 'Untitled' NOT NULL,
	"content" jsonb,
	"icon" text,
	"cover" jsonb,
	"position" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workspaces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"icon" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "stories_documents" ADD CONSTRAINT "stories_documents_project_id_stories_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."stories_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stories_sync_history" ADD CONSTRAINT "stories_sync_history_document_id_stories_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."stories_documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "article_versions" ADD CONSTRAINT "article_versions_post_id_blog_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."blog_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "article_versions" ADD CONSTRAINT "article_versions_created_by_user_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user_profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_user_id_user_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_parent_id_blog_posts_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."blog_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_session_id_chat_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."chat_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_sessions" ADD CONSTRAINT "chat_sessions_user_id_user_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_user_id_user_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_session_id_chat_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."chat_sessions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "export_configs" ADD CONSTRAINT "export_configs_user_id_user_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storage_files" ADD CONSTRAINT "storage_files_user_id_user_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stories" ADD CONSTRAINT "stories_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_boards" ADD CONSTRAINT "task_boards_user_id_user_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_columns" ADD CONSTRAINT "task_columns_board_id_task_boards_id_fk" FOREIGN KEY ("board_id") REFERENCES "public"."task_boards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_tag_assignments" ADD CONSTRAINT "task_tag_assignments_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_tag_assignments" ADD CONSTRAINT "task_tag_assignments_tag_id_task_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."task_tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_tags" ADD CONSTRAINT "task_tags_user_id_user_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_board_id_task_boards_id_fk" FOREIGN KEY ("board_id") REFERENCES "public"."task_boards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_column_id_task_columns_id_fk" FOREIGN KEY ("column_id") REFERENCES "public"."task_columns"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_parent_id_tasks_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_ai_settings" ADD CONSTRAINT "user_ai_settings_user_id_user_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_api_keys" ADD CONSTRAINT "user_api_keys_user_id_user_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_pages" ADD CONSTRAINT "workspace_pages_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_pages" ADD CONSTRAINT "workspace_pages_parent_id_workspace_pages_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."workspace_pages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_user_id_user_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_comments_post" ON "comments" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "idx_stories_documents_project_type" ON "stories_documents" USING btree ("project_id","document_type");--> statement-breakpoint
CREATE INDEX "idx_stories_documents_updated" ON "stories_documents" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "idx_stories_platform_connections_user_platform" ON "stories_platform_connections" USING btree ("user_id","platform");--> statement-breakpoint
CREATE INDEX "idx_stories_platform_connections_status" ON "stories_platform_connections" USING btree ("connection_status");--> statement-breakpoint
CREATE INDEX "idx_stories_platform_connections_email" ON "stories_platform_connections" USING btree ("google_account_email");--> statement-breakpoint
CREATE INDEX "idx_stories_projects_user_platform" ON "stories_projects" USING btree ("user_id","platform");--> statement-breakpoint
CREATE INDEX "idx_stories_projects_status" ON "stories_projects" USING btree ("connection_status");--> statement-breakpoint
CREATE INDEX "idx_stories_sync_history_document_date" ON "stories_sync_history" USING btree ("document_id","started_at");--> statement-breakpoint
CREATE INDEX "idx_stories_sync_history_status" ON "stories_sync_history" USING btree ("sync_status");--> statement-breakpoint
CREATE INDEX "idx_user_platform_configs_user_platform" ON "user_platform_configs" USING btree ("user_id","platform");--> statement-breakpoint
CREATE INDEX "idx_user_platform_configs_active" ON "user_platform_configs" USING btree ("user_id","is_active");--> statement-breakpoint
CREATE INDEX "idx_versions_post_date" ON "article_versions" USING btree ("post_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_versions_user" ON "article_versions" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "idx_blog_posts_user" ON "blog_posts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_blog_posts_parent" ON "blog_posts" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "idx_chat_messages_session_created" ON "chat_messages" USING btree ("session_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_chat_sessions_user_created" ON "chat_sessions" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_documents_user_created" ON "documents" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_export_configs_user" ON "export_configs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_storage_files_user" ON "storage_files" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_storage_files_entity" ON "storage_files" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "idx_stories_document_position" ON "stories" USING btree ("document_id","position");--> statement-breakpoint
CREATE INDEX "idx_task_boards_user" ON "task_boards" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_task_columns_board" ON "task_columns" USING btree ("board_id");--> statement-breakpoint
CREATE INDEX "idx_tag_assignment_tag" ON "task_tag_assignments" USING btree ("tag_id");--> statement-breakpoint
CREATE INDEX "idx_task_tags_user" ON "task_tags" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_tasks_board" ON "tasks" USING btree ("board_id");--> statement-breakpoint
CREATE INDEX "idx_tasks_column" ON "tasks" USING btree ("column_id");--> statement-breakpoint
CREATE INDEX "idx_tasks_parent" ON "tasks" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "idx_user_api_keys_user" ON "user_api_keys" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_workspace_pages_workspace" ON "workspace_pages" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "idx_workspace_pages_parent" ON "workspace_pages" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "idx_workspaces_user" ON "workspaces" USING btree ("user_id");