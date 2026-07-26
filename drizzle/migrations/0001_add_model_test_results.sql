CREATE TABLE "blog_chat_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" text NOT NULL,
	"content" jsonb NOT NULL,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "model_test_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"model_id" text NOT NULL,
	"success" boolean NOT NULL,
	"tested_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_model_test_results_user_model" UNIQUE("user_id","model_id")
);
--> statement-breakpoint
ALTER TABLE "model_test_results" ADD CONSTRAINT "model_test_results_user_id_user_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_blog_chat_messages_post_id" ON "blog_chat_messages" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "idx_blog_chat_messages_user_id" ON "blog_chat_messages" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_blog_chat_messages_timestamp" ON "blog_chat_messages" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "idx_model_test_results_user" ON "model_test_results" USING btree ("user_id");