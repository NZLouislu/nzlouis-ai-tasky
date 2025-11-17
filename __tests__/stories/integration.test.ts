/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  parseStoriesContent, 
  mapStoryToJiraIssue,
  syncStoryToJira 
} from '@/lib/stories/sync/jira-sync';
import { 
  parseStoriesForTrello,
  createTrelloCard,
  syncStoriesToTrello 
} from '@/lib/stories/sync/trello-sync';
import { 
  markdownToADF,
  adfToJson,
  ADFDocument
} from '@/lib/stories/converters/markdown-to-adf';
import { 
  markdownToTrello,
  parseStoryToTrelloCard 
} from '@/lib/stories/converters/markdown-to-trello';
import { 
  mockProject,
  mockDocument,
  mockApiResponses,
  mockFetch,
  testSetup,
  generators
} from '@/lib/stories/testing/test-utils';

describe('Jira Sync Integration', () => {
  beforeEach(() => {
    testSetup.beforeEach();
  });

  afterEach(() => {
    testSetup.afterEach();
  });

  it('parses stories content correctly', () => {
    const storiesContent = `- Story: User Login
  Description: As a user, I want to login so that I can access my account.
  Acceptance_Criteria:
    - [ ] User can enter email and password
    - [ ] System validates credentials
    - [ ] User is redirected to dashboard
  Priority: High
  Labels: [authentication, security]
  Assignees: John Doe
  Reporter: Product Manager

- Story: User Profile
  Description: As a user, I want to view my profile so that I can see my information.
  Acceptance_Criteria:
    - [ ] Display user name and email
    - [ ] Show profile picture
  Priority: Medium
  Labels: [profile]
  Assignees: Jane Smith
  Reporter: Product Manager`;

    const stories = parseStoriesContent(storiesContent);

    expect(stories).toHaveLength(2);
    expect(stories[0].title).toBe('User Login');
    expect(stories[0].priority).toBe('High');
    expect(stories[0].labels).toEqual(['authentication', 'security']);
    expect(stories[0].assignees).toEqual(['John Doe']);
    expect(stories[0].acceptanceCriteria).toHaveLength(3);

    expect(stories[1].title).toBe('User Profile');
    expect(stories[1].priority).toBe('Medium');
    expect(stories[1].labels).toEqual(['profile']);
    expect(stories[1].assignees).toEqual(['Jane Smith']);
  });

  it('maps story to Jira issue format', () => {
    const story = {
      title: 'User Login',
      description: 'As a user, I want to login so that I can access my account.',
      priority: 'High',
      labels: ['authentication', 'security'],
      assignees: ['john.doe'],
      reporter: 'product.manager',
      acceptanceCriteria: [
        'User can enter email and password',
        'System validates credentials',
        'User is redirected to dashboard'
      ]
    };

    const priorityMap = { 'high': '1', 'medium': '3', 'low': '4' };
    const userMap = { 
      'john.doe': 'user123',
      'product.manager': 'pm456'
    };

    const jiraIssue = mapStoryToJiraIssue(
      story,
      'TEST',
      '10001',
      priorityMap,
      userMap
    );

    expect(jiraIssue.fields.summary).toBe('User Login');
    expect(jiraIssue.fields.project.key).toBe('TEST');
    expect(jiraIssue.fields.issuetype.id).toBe('10001');
    expect(jiraIssue.fields.priority?.id).toBe('1');
    expect(jiraIssue.fields.labels).toEqual(['authentication', 'security']);
    expect(jiraIssue.fields.assignee?.accountId).toBe('user123');
    expect(jiraIssue.fields.reporter?.accountId).toBe('pm456');
  });

  it('handles Jira sync with API calls', async () => {
    global.fetch = mockFetch({
      'POST https://test.atlassian.net/rest/api/3/issue': {
        key: 'TEST-123',
        id: '10001'
      }
    });

    const story = {
      title: 'Test Story',
      description: 'Test description',
      priority: 'High',
      labels: ['test'],
      assignees: ['test.user'],
      reporter: 'test.reporter',
      acceptanceCriteria: ['Test criterion']
    };

    const jiraConfig = {
      baseUrl: 'https://test.atlassian.net',
      email: 'test@example.com',
      apiToken: 'test-token',
      projectKey: 'TEST',
      issueTypeId: '10001',
      subTaskTypeId: '10003',
      priorityMap: { 'high': '1' },
      userMap: { 'test.user': 'user123' }
    };

    const result = await syncStoryToJira(story, jiraConfig);

    expect(result.success).toBe(true);
    expect(result.issueKey).toBe('TEST-123');
    expect(global.fetch).toHaveBeenCalledWith(
      'https://test.atlassian.net/rest/api/3/issue',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json'
        })
      })
    );
  });
});

describe('Trello Sync Integration', () => {
  beforeEach(() => {
    testSetup.beforeEach();
  });

  it('parses stories for Trello format', () => {
    const storiesContent = generators.multipleStories(2);
    const stories = parseStoriesForTrello(storiesContent);

    expect(stories).toHaveLength(2);
    expect(stories[0].title).toBe('Test Story 1');
    expect(stories[0].priority).toBe('Medium');
    expect(stories[0].labels).toEqual(['test']);
    expect(stories[0].acceptanceCriteria).toHaveLength(3);
  });

  it('creates Trello card with checklists', async () => {
    global.fetch = mockFetch({
      'POST https://api.trello.com/1/cards?key=test-key&token=test-token': {
        id: 'card123',
        url: 'https://trello.com/c/card123'
      },
      'POST https://api.trello.com/1/checklists?key=test-key&token=test-token': {
        id: 'checklist123'
      }
    }) as any;

    const story = {
      title: 'Test Story',
      description: 'Test description',
      priority: 'High',
      labels: ['test'],
      assignees: ['test.user'],
      acceptanceCriteria: [
        { text: 'First criterion', checked: false },
        { text: 'Second criterion', checked: true }
      ]
    };

    const trelloConfig = { key: 'test-key', token: 'test-token' };
    const options = {
      labels: [{ id: 'label1', name: 'High Priority', color: 'red' }],
      members: [{ id: 'member1', username: 'test.user', fullName: 'Test User' }],
      priorityLabelMap: { 'high': 'High Priority' },
      memberAliasMap: {}
    };

    const result = await createTrelloCard(
      story,
      'board123',
      'list123',
      trelloConfig,
      options
    );

    expect(result.success).toBe(true);
    expect(result.cardId).toBe('card123');
    expect(result.cardUrl).toBe('https://trello.com/c/card123');
    expect(result.checklistsCreated).toBe(1);
  });
});

describe('Format Conversion', () => {
  it('converts markdown to ADF correctly', () => {
    const markdown = `# User Story
As a user, I want to **login** so that I can access my account.

## Acceptance Criteria
- User can enter credentials
- System validates login

\`\`\`javascript
const login = (email, password) => {
  return authenticate(email, password);
};
\`\`\``;

    const adf: ADFDocument = markdownToADF(markdown);

    expect(adf.type).toBe('doc');
    expect(adf.version).toBe(1);
    expect(adf.content).toHaveLength(5); // heading, paragraph, heading, list, code block

    // Check heading
    expect(adf.content[0].type).toBe('heading');
    expect(adf.content[0].attrs?.level).toBe(1);
    if (adf.content[0].content) {
      expect(adf.content[0].content[0].text).toBe('User Story');
    }

    // Check paragraph with bold text
    expect(adf.content[1].type).toBe('paragraph');
    if (adf.content[1].content) {
      const boldText = adf.content[1].content.find((node: any) => 
        node.marks?.some((mark: any) => mark.type === 'strong')
      );
      expect(boldText?.text).toBe('login');
    }

    // Check code block
    const codeBlock = adf.content.find((node: any) => node.type === 'codeBlock');
    expect(codeBlock?.attrs?.language).toBe('javascript');
    if (codeBlock?.content) {
      expect(codeBlock.content[0].text).toContain('const login');
    }
  });

  it('converts ADF to JSON string', () => {
    const adf: ADFDocument = {
      version: 1 as const,
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Hello world'
            }
          ]
        }
      ]
    };

    const json = adfToJson(adf);
    const parsed = JSON.parse(json);

    expect(parsed.version).toBe(1);
    expect(parsed.type).toBe('doc');
    expect(parsed.content[0].type).toBe('paragraph');
    if (parsed.content[0].content) {
      expect(parsed.content[0].content[0].text).toBe('Hello world');
    }
  });

  it('converts markdown to Trello card format', () => {
    const markdown = `# User Login Feature
As a user, I want to login so that I can access my account.

## Tasks
- [ ] Create login form
- [x] Implement validation
- [ ] Add error handling

**Priority:** High
**Labels:** authentication, security
**Assignees:** john.doe, jane.smith`;

    const trelloCard = parseStoryToTrelloCard(markdown);

    expect(trelloCard.name).toBe('User Login Feature');
    expect(trelloCard.desc).toContain('As a user, I want to login');
    if (trelloCard.checklists) {
      expect(trelloCard.checklists).toHaveLength(1);
      if (trelloCard.checklists[0].items) {
        expect(trelloCard.checklists[0].items).toHaveLength(3);
        expect(trelloCard.checklists[0].items[1].checked).toBe(true);
      }
    }
  });

  it('handles complex markdown with multiple elements', () => {
    const markdown = `# Complex Story

This is a **complex** story with *italic* text and \`inline code\`.

## Description
> This is a blockquote
> with multiple lines

### Acceptance Criteria
1. First numbered item
2. Second numbered item

- Bullet point 1
- Bullet point 2

\`\`\`python
def example():
    return "Hello World"
\`\`\`

[Link to documentation](https://example.com)

---

Final paragraph with ~~strikethrough~~ text.`;

    const adf = markdownToADF(markdown);

    expect(adf.content).toContainEqual(
      expect.objectContaining({ type: 'heading' })
    );
    expect(adf.content).toContainEqual(
      expect.objectContaining({ type: 'paragraph' })
    );
    expect(adf.content).toContainEqual(
      expect.objectContaining({ type: 'blockquote' })
    );
    expect(adf.content).toContainEqual(
      expect.objectContaining({ type: 'orderedList' })
    );
    expect(adf.content).toContainEqual(
      expect.objectContaining({ type: 'bulletList' })
    );
    expect(adf.content).toContainEqual(
      expect.objectContaining({ type: 'codeBlock' })
    );
    expect(adf.content).toContainEqual(
      expect.objectContaining({ type: 'rule' })
    );
  });
});

describe('Error Handling in Sync Operations', () => {
  beforeEach(() => {
    testSetup.beforeEach();
  });

  it('handles Jira API errors gracefully', async () => {
    global.fetch = vi.fn().mockImplementation(() => {
      return Promise.reject(new Error('Authentication failed'));
    });

    const story = {
      title: 'Test Story',
      description: 'Test description',
      priority: 'High',
      labels: [],
      assignees: [],
      reporter: '',
      acceptanceCriteria: []
    };

    const jiraConfig = {
      baseUrl: 'https://test.atlassian.net',
      email: 'test@example.com',
      apiToken: 'invalid-token',
      projectKey: 'TEST',
      issueTypeId: '10001',
      subTaskTypeId: '10003',
      priorityMap: {},
      userMap: {}
    };

    const result = await syncStoryToJira(story, jiraConfig);

    expect(result.success).toBe(false);
    expect(result.error).toContain('Authentication failed');
  });

  it('handles Trello API errors gracefully', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    const story = {
      title: 'Test Story',
      description: 'Test description',
      priority: 'High',
      labels: [],
      assignees: [],
      acceptanceCriteria: []
    };

    const trelloConfig = { key: 'test-key', token: 'test-token' };
    const options = {
      labels: [],
      members: [],
      priorityLabelMap: {},
      memberAliasMap: {}
    };

    const result = await createTrelloCard(
      story,
      'board123',
      'list123',
      trelloConfig,
      options
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain('Network error');
  });
});

describe('Performance and Edge Cases', () => {
  it('handles large story documents efficiently', () => {
    const largeContent = generators.multipleStories(100);
    
    const startTime = Date.now();
    const stories = parseStoriesContent(largeContent);
    const endTime = Date.now();

    expect(stories).toHaveLength(100);
    expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
  });

  it('handles malformed story content gracefully', () => {
    const malformedContent = `- Story: Incomplete story
  Description: Missing acceptance criteria
  Priority: High

- Not a story at all
  Just random text

- Story: Another incomplete
  Missing description`;

    const stories = parseStoriesContent(malformedContent);
    
    // Should still parse what it can
    expect(stories.length).toBeGreaterThan(0);
    
    // Should handle malformed content gracefully
    stories.forEach(story => {
      expect(story.title).toBeDefined();
      expect(Array.isArray(story.acceptanceCriteria)).toBe(true);
      expect(Array.isArray(story.labels)).toBe(true);
      expect(Array.isArray(story.assignees)).toBe(true);
    });
  });

  it('handles empty or null content', () => {
    expect(parseStoriesContent('')).toEqual([]);
    expect(parseStoriesContent('   ')).toEqual([]);
    expect(parseStoriesForTrello('')).toEqual([]);
  });
});