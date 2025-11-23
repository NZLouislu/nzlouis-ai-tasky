# Blog Smart AI Assistant Implementation Stories

## Project Overview

This document contains user stories for implementing the Smart AI Assistant for Blog editing, transforming the current basic AI modification tool into an intelligent writing partner that understands document structure, provides previews, and supports multi-turn conversations.

**Project**: NZLouis AI Tasky - Blog Smart Assistant  
**Epic**: BLOG-AI (Blog Intelligent Writing Assistant)  
**Version**: 1.0  
**Created**: 2025-11-23  
**Target Test Coverage**: 80%+  
**Build Requirement**: Zero TypeScript errors  
**UI Language**: English only

---

## 🎯 Epic: BLOG-AI - Smart AI Writing Assistant

**Goal**: Transform blog AI from "text editor tool" to "intelligent writing partner"

**Business Value**:

- Increase user editing efficiency by 60%
- Improve modification acceptance rate from 70% to 95%
- Achieve user satisfaction score > 4.5/5

**Success Metrics**:

- AI call success rate > 98%
- Response time < 2 seconds
- User modification acceptance rate > 90%

---

## Phase 1: MVP Foundation (Week 1-2)

### Story BLOG-AI-201: Document Structure Analyzer

**Description**: Implement a document analyzer that understands article structure (headings, sections, paragraphs) to enable AI to comprehend "optimize Section 2" type instructions.

**As a** blog author  
**I want** AI to understand my article's structure  
**So that** when I say "optimize the second section", AI knows exactly where to modify

**Acceptance Criteria**:

- [ ] Create `lib/blog/document-analyzer.ts` class
- [ ] Implement `generateOutline()` to parse heading hierarchy (h1-h6)
- [ ] Implement `parseSections()` to group content by headings
- [ ] Implement `calculateStats()` for word count, reading time, paragraph count
- [ ] Return structured data: outline, sections, stats
- [ ] Integrate analyzer into `/api/blog/ai-modify` route
- [ ] Update AI prompt to include document structure
- [ ] AI can correctly locate "Section 2" or "third paragraph"
- [ ] Handle edge cases: no headings, deeply nested headings (5+ levels)
- [ ] Write unit tests achieving >90% coverage
- [ ] All tests pass: `npm test -- document-analyzer`
- [ ] Build succeeds with zero TypeScript errors

**Technical Tasks**:

1. Define TypeScript interfaces: `OutlineNode`, `Section`, `DocumentStats`, `DocumentStructure`
2. Implement outline generation with proper parent-child relationships
3. Implement section parsing based on heading boundaries
4. Implement statistics calculation (words, sentences, reading time)
5. Add text extraction helpers for BlockNote content
6. Write comprehensive test suite

**Priority**: 🔴 P0 (Critical)  
**Labels**: [blog, ai, structure-analysis, mvp]  
**Assignees**: Louis Lu  
**Reporter**: Louis Lu  
**Estimate**: 3 hours  
**Dependencies**: None

**Testing Notes**:

- Test with articles having no headings
- Test with 10+ nested heading levels
- Test with 1000+ paragraphs (performance)
- Verify word count accuracy across different languages

---

### Story BLOG-AI-202: Modification Preview Component

**Description**: Create a preview dialog that shows diff comparison before applying AI modifications, allowing users to accept, reject, or edit changes.

**As a** blog author  
**I want** to preview AI modifications before they are applied  
**So that** I can review changes and decide whether to accept, reject, or edit them

**Acceptance Criteria**:

- [ ] Install dependency: `npm install react-diff-viewer-continued`
- [ ] Create `components/blog/ModificationPreview.tsx` component
- [ ] Display side-by-side diff comparison (Before | After)
- [ ] Highlight added content in green
- [ ] Highlight removed content in red
- [ ] Show AI explanation at the top
- [ ] Implement three action buttons: Accept, Reject, Edit
- [ ] Edit mode allows modifying AI suggestions
- [ ] Apply changes only when user clicks Accept
- [ ] Close dialog when user clicks Reject
- [ ] Add keyboard shortcuts: Enter (Accept), Esc (Reject)
      **Assignees**: Louis Lu  
      **Reporter**: Louis Lu  
      **Estimate**: 5 hours  
      **Dependencies**: BLOG-AI-204

**Scoring Criteria**:

Structure (0-100):

- Has clear heading hierarchy: +20
- Appropriate paragraph length (80-200 words): +20
- Has introduction and conclusion: +20
- Logical flow: +20
- Use of lists and formatting: +20

Content (0-100):

- Depth and detail: AI-evaluated
- Use of examples: AI-evaluated
- Clarity of expression: AI-evaluated
- Topic consistency: AI-evaluated

Readability (0-100):

- Average sentence length < 20 words: +25
- Vocabulary complexity level: +25
- Transition words usage: +25
- Paragraph coherence: +25

---

### Story BLOG-AI-206: Quality Dashboard Component

**Description**: Create a visual dashboard showing article quality metrics with actionable improvement suggestions.

**As a** blog author  
**I want** a visual dashboard showing my article quality  
**So that** I can quickly identify areas that need improvement

**Acceptance Criteria**:

- [ ] Create `components/blog/ArticleHealthDashboard.tsx`
- [ ] Display overall quality score with progress bar
- [ ] Show three dimension scores: Structure, Content, Readability
- [ ] Use color coding: Red (<60), Yellow (60-79), Green (80+)
- [ ] Display icon indicators for each dimension
- [ ] Show top 5 improvement suggestions
- [ ] Each suggestion has "Apply" button
- [ ] Clicking "Apply" triggers AI to fix the issue
- [ ] Add "Refresh Analysis" button
- [ ] Show loading state during analysis
- [ ] Handle empty state (no analysis yet)
- [ ] Ensure responsive design for mobile
- [ ] Write component tests achieving >80% coverage
- [ ] Build succeeds with zero TypeScript errors

**Technical Tasks**:

1. Create dashboard component with TypeScript props
2. Implement score visualization with progress bars
3. Create suggestion cards with action buttons
4. Integrate with article intelligence API
5. Add loading and error states
6. Implement suggestion application logic
7. Write React Testing Library tests

**Priority**: 🟡 P1 (High)  
**Labels**: [blog, ai, ui, dashboard]  
**Assignees**: Louis Lu  
**Reporter**: Louis Lu  
**Estimate**: 4 hours  
**Dependencies**: BLOG-AI-205

**UI Design**:

```
┌────────────────────────────────┐
│ 📊 Article Quality             │
├────────────────────────────────┤
│ Overall: ████████░░ 85/100     │
├────────────────────────────────┤
│ Structure  ███████░░░ 78       │
│ Content    █████████░ 92       │
│ Readability████████░░ 81       │
├────────────────────────────────┤
│ 💡 Improvement Suggestions     │
│ 1. Paragraph 3 too long [Fix]  │
│ 2. Add more examples   [Fix]   │
│ 3. Heading hierarchy   [Fix]   │
└────────────────────────────────┘
```

---

### Story BLOG-AI-207: Auto-Suggestion Engine

**Description**: Implement an engine that automatically detects article issues and provides actionable AI-powered fix suggestions.

**As a** blog author  
**I want** AI to proactively identify article problems  
**So that** I can quickly improve my writing without manually checking

**Acceptance Criteria**:

- [ ] Extend `ArticleIntelligence` class with `detectIssues()`
- [ ] Detect long paragraphs (>200 words)
- [ ] Detect weak transitions between paragraphs
- [ ] Detect repetitive word usage (same word used 5+ times)
- [ ] Detect missing examples in technical content
- [ ] Detect inconsistent heading levels (e.g., h1 → h3, skipping h2)
- [ ] Each issue includes: type, severity, location, message, autoFix function
- [ ] Create `components/blog/SuggestionsList.tsx`
- [ ] Display suggestions sorted by severity (high → medium → low)
- [ ] Each suggestion has "Apply" and "Dismiss" buttons
- [ ] Clicking "Apply" calls AI to generate fix
- [ ] Track dismissed suggestions (don't show again)
- [ ] Write tests for all issue detection algorithms
- [ ] Build succeeds with zero TypeScript errors

**Technical Tasks**:

1. Define `Issue`, `IssueSeverity` interfaces
2. Implement detection algorithms for each issue type
3. Create suggestions list component
4. Implement apply and dismiss logic
5. Add severity badging (High/Medium/Low)
6. Test with various article types
7. Write comprehensive test suite

**Priority**: 🟡 P1 (High)  
**Labels**: [blog, ai, suggestions, auto-fix]  
**Assignees**: Louis Lu  
**Reporter**: Louis Lu  
**Estimate**: 5 hours  
**Dependencies**: BLOG-AI-206

**Issue Types**:

| Type             | Severity | Detection Criteria                      |
| ---------------- | -------- | --------------------------------------- |
| Long Paragraph   | Medium   | >200 words                              |
| Weak Transition  | High     | No connecting words between paragraphs  |
| Repetitive Words | Low      | Same word used 5+ times in 3 paragraphs |
| Missing Examples | Medium   | Technical content with 0 code blocks    |
| Heading Gaps     | High     | h1 → h3 without h2                      |

---

### Story BLOG-AI-208: Article Restructuring Engine

**Description**: Implement one-click article restructuring to transform articles between different formats (academic, blog, tutorial, story).

**As a** blog author  
**I want** to transform my article into different formats  
**So that** I can adapt content for different audiences and platforms

**Acceptance Criteria**:

- [ ] Create `lib/blog/article-templates.ts` with format definitions
- [ ] Define templates: academic, blog, tutorial, story
- [ ] Each template specifies: structure, sections, style guidelines
- [ ] Create `/api/blog/restructure` endpoint
- [ ] Implement `restructureArticle()` function using AI
- [ ] AI maps current content to target template sections
- [ ] Preserve all original content (no data loss)
- [ ] Adjust writing tone based on target format
- [ ] Create `components/blog/RestructureDialog.tsx`
- [ ] Show template selection with preview
- [ ] Display restructure plan before applying
- [ ] Allow user to review and accept/reject
- [ ] Write API tests achieving >85% coverage
- [ ] Build succeeds with zero TypeScript errors

**Technical Tasks**:

1. Define article templates with structure and style rules
2. Create API endpoint for restructuring
3. Build AI prompt for content transformation
4. Implement content mapping logic
5. Create restructure dialog component
6. Add preview functionality
7. Test with various article types

**Priority**: 🟢 P2 (Medium)  
**Labels**: [blog, ai, restructure, advanced]  
**Assignees**: Louis Lu  
**Reporter**: Louis Lu  
**Estimate**: 6 hours  
**Dependencies**: BLOG-AI-207

**Templates**:

Academic Paper:

```
1. Abstract
2. Introduction
3. Literature Review
4. Methodology
5. Results
6. Discussion
7. Conclusion
8. References
```

Blog Post:

```
1. Catchy Title
2. Hook/Introduction
3. Main Content (3-5 sections)
4. Conclusion/Call-to-Action
```

Tutorial:

```
1. Overview
2. Prerequisites
3. Step-by-Step Instructions
4. Common Issues/Troubleshooting
5. Next Steps
```

---

## Phase 3: Advanced Features (Week 5-6)

### Story BLOG-AI-209: Version Control System

**Description**: Implement automatic version saving and history tracking for blog posts, enabling users to review and rollback changes.

**As a** blog author  
**I want** automatic version saving of my articles  
**So that** I can review change history and restore previous versions if needed

**Acceptance Criteria**:

- [ ] Create database migration for `article_versions` table
- [ ] Table columns: id, post_id, content, metadata, created_at, created_by
- [ ] Create index on (post_id, created_at DESC)
- [ ] Implement auto-save trigger on blog_posts content update
- [ ] Create `lib/blog/version-control.ts` class
- [ ] Implement `saveVersion()` with metadata (trigger, description)
- [ ] Implement `getVersionHistory()` ordered by date
- [ ] Implement `rollbackToVersion()` with confirmation
- [ ] Implement `compareVersions()` showing diff
- [ ] Create `components/blog/VersionHistory.tsx`
- [ ] Display timeline of versions with icons (AI/Auto/Manual)
- [ ] Each version has: Preview, Restore, Compare actions
- [ ] Limit display to last 50 versions (pagination)
- [ ] Write database migration tests
- [ ] Build succeeds with zero TypeScript errors

**Technical Tasks**:

1. Create Supabase migration file
2. Write SQL for table and trigger
3. Implement version control class
4. Create version history component
5. Implement version comparison view
6. Add rollback confirmation dialog
7. Test CASCADE delete behavior
8. Write comprehensive test suite

**Priority**: 🟢 P2 (Medium)  
**Labels**: [blog, version-control, database]  
**Assignees**: Louis Lu  
**Reporter**: Louis Lu  
**Estimate**: 5 hours  
**Dependencies**: BLOG-AI-208

**Database Schema**:

```sql
CREATE TABLE article_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  content JSONB NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

CREATE INDEX idx_versions_post_date
ON article_versions(post_id, created_at DESC);
```

---

### Story BLOG-AI-210: Enhanced AI Prompt Engineering

**Description**: Optimize AI prompts to include document structure, user context, and conversation history for better modification suggestions.

**As a** developer  
**I want** optimized AI prompts  
**So that** AI generates more accurate and contextual suggestions

**Acceptance Criteria**:

- [ ] Update system prompt to include document structure info
- [ ] Include article outline in prompt
- [ ] Include section summaries
- [ ] Include conversation history (last 10 turns)
- [ ] Include user writing style preferences
- [ ] Specify exact JSON output format requirements
- [ ] Add output validation rules to prompt
- [ ] Test prompt with 20+ different instructions
- [ ] Measure improvement in modification acceptance rate
- [ ] Document prompt template in README
- [ ] Create A/B test comparing old vs new prompts
- [ ] Achieve >90% modification acceptance rate
- [ ] Build succeeds with zero TypeScript errors

**Technical Tasks**:

1. Design new context-aware prompt template
2. Implement prompt builder with all context
3. Add JSON schema validation instructions
4. Create prompt testing suite
5. Run A/B tests with real users
6. Document best practices
7. Optimize for cost and performance

**Priority**: 🔴 P0 (Critical)  
**Labels**: [blog, ai, prompt, optimization]  
**Assignees**: Louis Lu  
**Reporter**: Louis Lu  
**Estimate**: 6 hours  
**Dependencies**: None (Can be done in parallel)

**Prompt Template Structure**:

```typescript
const systemPrompt = `
You are an expert blog editor with deep understanding of content structure.

**Document Analysis:**
${documentStructure}

**User Preferences:**
${userPreferences}

**Conversation History:**
${conversationHistory}

**Current Task:**
${instruction}

**Output Requirements:**
[Strict JSON schema]
`;
```

---

## Epic Completion Criteria

### MVP (Phase 1) - Week 2:

- [ ] All P0 stories completed
- [ ] Document analyzer working
- [ ] Preview functionality operational
- [ ] Multi-turn conversation functional
- [ ] Test coverage >80%
- [ ] Build passes with zero errors
- [ ] User acceptance: 3 users tested, avg score >4.0/5

### Enhanced (Phase 2) - Week 4:

- [ ] All P1 stories completed
- [ ] Quality scoring implemented
- [ ] Auto-suggestions working
- [ ] Restructuring functional
- [ ] Test coverage maintained >80%
- [ ] User acceptance: 5 users tested, avg score >4.3/5

### Advanced (Phase 3) - Week 6:

- [ ] All P2 stories completed
- [ ] Version control operational
- [ ] All advanced features tested
- [ ] Documentation complete
- [ ] Ready for production deployment
- [ ] User acceptance: 10 users tested, avg score >4.5/5

---

## Summary

### Total Stories: 10

### Total Estimated Time: 45 hours (~2 weeks for 1 developer)

### By Priority:

- **P0 (Critical)**: 5 stories (21 hours)
- **P1 (High)**: 3 stories (14 hours)
- **P2 (Medium)**: 2 stories (11 hours)

### By Phase:

- **Phase 1 (MVP)**: 4 stories (14 hours)
- **Phase 2 (Enhanced)**: 4 stories (20 hours)
- **Phase 3 (Advanced)**: 2 stories (11 hours)

### Testing Requirements:

- Unit tests for all business logic
- Integration tests for all API routes
- Component tests for all UI components
- E2E tests for critical user flows
- Target: 80%+ code coverage

---

## Environment Variables Required

```bash
# Already existing
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
GOOGLE_API_KEY=
NEXTAUTH_SECRET=

# Optional (for advanced features)
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
```

---

## Technical Debt and Future Enhancements

### Post-MVP Improvements:

- [ ] Real-time collaborative editing with AI
- [ ] Voice-to-text for AI instructions
- [ ] Semantic search within articles
- [ ] AI writing style learning (adapts to user)
- [ ] Multi-language support for non-English articles
- [ ] Integration with grammar checkers (Grammarly API)
- [ ] SEO optimization suggestions
- [ ] Plagiarism detection
- [ ] Citation management system

### Performance Optimizations:

- [ ] Implement Redis caching for AI responses
- [ ] Add rate limiting for AI API calls
- [ ] Optimize large document handling (10,000+ words)
- [ ] Implement virtual scrolling for version history
- [ ] Add CDN caching for static analysis results

---

**Document Status**: ✅ Ready for Development  
**Last Updated**: 2025-11-23  
**Next Review**: After MVP completion (Week 2)
