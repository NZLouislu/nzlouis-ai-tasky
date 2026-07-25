import { pgTable, uuid, text, boolean, integer, timestamp, index, date, unique } from 'drizzle-orm/pg-core';
import { blogPosts, userProfiles } from './tasky';

// ─── Feature Toggles ─────────────────────────────────────────
export const featureToggles = pgTable('feature_toggles', {
  id: uuid('id').primaryKey().defaultRandom(),
  totalViews: boolean('total_views').default(true),
  totalLikes: boolean('total_likes').default(true),
  totalComments: boolean('total_comments').default(true),
  aiSummaries: boolean('ai_summaries').default(true),
  aiQuestions: boolean('ai_questions').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─── Comments ────────────────────────────────────────────────
export const comments = pgTable('comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  postId: text('post_id').notNull(),
  name: text('name'),
  email: text('email'),
  comment: text('comment').notNull(),
  isAnonymous: boolean('is_anonymous').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  postIdx: index('idx_comments_post').on(table.postId),
}));

// ─── Post Stats ──────────────────────────────────────────────
export const postStats = pgTable('post_stats', {
  id: uuid('id').primaryKey().defaultRandom(),
  postId: text('post_id').notNull().unique(),
  title: text('title').default('Blog Post'),
  views: integer('views').default(0),
  likes: integer('likes').default(0),
  aiQuestions: integer('ai_questions').default(0),
  aiSummaries: integer('ai_summaries').default(0),
});

// ─── Daily Stats ─────────────────────────────────────────────
export const dailyStats = pgTable('daily_stats', {
  id: uuid('id').primaryKey().defaultRandom(),
  postId: text('post_id').notNull(),
  date: date('date').notNull(),
  views: integer('views').default(0),
  likes: integer('likes').default(0),
  aiQuestions: integer('ai_questions').default(0),
  aiSummaries: integer('ai_summaries').default(0),
}, (table) => ({
  postDateUnique: unique('uq_daily_stats_post_date').on(table.postId, table.date),
}));
