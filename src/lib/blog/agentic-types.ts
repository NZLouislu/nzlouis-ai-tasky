/**
 * Type definitions for the Agentic Blog Editor system
 * This file contains all interfaces and types used in the 6-stage AI pipeline
 */

import { PartialBlock } from '@blocknote/core';
import { DocumentStructure } from './document-analyzer';

// ========== Core Request/Response Types ==========

export interface AgentRequest {
  message: string;
  conversation_id?: string;
  post_id: string;
  current_content: PartialBlock[];
  current_title: string;
  user_id: string;
}

export interface AgentResponse {
  conversation_id: string;
  message_id: string;
  requiresSetup?: boolean;
  message?: string;

  // AI's reply message
  reply: {
    type: 'text' | 'modification_preview' | 'clarification' | 'suggestion';
    content: string;
    metadata?: Record<string, unknown>;
  };

  // If it's a modification preview
  modification_preview?: {
    modifications: PageModification[];
    explanation: string;
    quality_score: number;
    preview_blocks: PartialBlock[];
    diff: DiffResult;
    metadata?: Record<string, unknown>;
  };

  // Smart suggestions
  suggestions?: Suggestion[];

  // Internal state (for debugging)
  _debug?: {
    perception: PerceptionResult;
    planning: PlanningResult;
    search?: SearchContext;
    quality?: QualityMetrics;
    writingStyle?: any; // WritingStyle from cache
  };
}

// ========== Page Modification Types ==========

export interface PageModification {
  type: 'replace' | 'insert' | 'append' | 'update_title' | 'add_section' | 'delete' | 'replace_paragraph';
  target?: string;
  content?: string;
  title?: string;
  position?: number;
  paragraphIndex?: number;
  block_range?: [number, number];
  metadata?: {
    word_count?: number;
    sources_used?: number[];
  };
}

// ========== Stage 1: Perception ==========

export type IntentType =
  | 'modify_content'
  | 'add_content'
  | 'delete_content'
  | 'improve_quality'
  | 'factcheck'
  | 'ask_question';

export type ScopeType = 'single_paragraph' | 'multiple_paragraphs' | 'full_article' | 'unknown';

export interface PerceptionResult {
  intent: IntentType;
  confidence: number; // 0-1
  documentStructure: DocumentStructure;
  extractedEntities: {
    targetSection?: string;
    keywords: string[];
    actionType?: 'expand' | 'rewrite' | 'correct';
  };
  // Paragraph-level analysis
  paragraphAnalysis: {
    scope: ScopeType;
    targetParagraphTitles?: string[];
    targetParagraphIndices?: number[];
    needsSubheadings: boolean;
  };
}

// ========== Stage 2: Planning ==========

export interface PlanningResult {
  thought_process: string;
  target_location: {
    section_index: number | null;
    section_title?: string;
    paragraph_index?: number | null;
    block_range?: [number, number];
  };
  action_plan: {
    type: 'expand' | 'rewrite' | 'insert' | 'delete' | 'correct';
    estimated_words: number;
    estimated_reading_time_increase: number;
  };
  needs_search: boolean;
  search_queries: string[];
  clarification_needed: boolean;
  clarification_questions: string[];
  suggestions: string[];
}

// ========== Stage 3: Retrieval ==========

export interface TavilyResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

export interface SearchContext {
  raw_results: TavilyResult[];
  summary: string;
  sources: { title: string; url: string }[];
}

// ========== Stage 4: Generation ==========

export interface GenerationResult {
  modifications: PageModification[];
  explanation: string;
  changes_summary: {
    words_added: number;
    reading_time_increased: number;
  };
}

// ========== Stage 5: Validation ==========

export interface QualityMetrics {
  factual_accuracy: number; // 0-10
  relevance: number; // 0-10
  readability: number; // 0-10
  coherence: number; // 0-10
  completeness: number; // 0-10
  overall_score: number; // 0-10
  issues: string[];
  suggestions_for_improvement: string[];
}

// ========== Stage 6: Suggestion ==========

export type SuggestionType = 'structure' | 'content' | 'style' | 'seo';
export type SuggestionPriority = 'high' | 'medium' | 'low';

export interface Suggestion {
  type: SuggestionType;
  priority: SuggestionPriority;
  title: string;
  description: string;
  action: string; // The command to send when user clicks
}

// ========== Diff Visualization ==========

export interface DiffResult {
  changes: Change[];
  stats: {
    blocks_added: number;
    blocks_modified: number;
    blocks_deleted: number;
    words_added: number;
    words_deleted: number;
  };
}

export interface Change {
  type: 'add' | 'modify' | 'delete';
  block_index: number;
  old_content?: string;
  new_content?: string;
}

// ========== Conversation State ==========

export interface ConversationState {
  conversation_id: string;
  post_id: string;
  user_id: string;
  messages: Message[];
  context: {
    current_document: PartialBlock[];
    last_modification: PageModification | null;
    pending_suggestions: Suggestion[];
    search_history: string[];
  };
  metadata: {
    total_words_added: number;
    total_modifications: number;
    session_duration: number;
  };
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

// ========== Virtual Numbering ==========

export interface VirtualNumbering {
  paragraph_index: number;
  h2_number: string;
  h3_number?: string;
  section_title: string;
  block_index: number;
  is_subsection?: boolean;
}

// ========== Batch Execution ==========

export interface BatchExecutionProgress {
  total_steps: number;
  current_step: number;
  completed_steps: number;
  failed_steps: number;
  progress_percentage: number;
  current_paragraph: string;
  current_action: string;
  time_elapsed: number;
  time_remaining: number;
  step_details: StepProgress[];
}

export interface StepProgress {
  step_number: number;
  paragraph_title: string;
  status: 'pending' | 'searching' | 'generating' | 'validating' | 'completed' | 'failed' | 'skipped';
  progress: number;
  word_count_added: number;
}
