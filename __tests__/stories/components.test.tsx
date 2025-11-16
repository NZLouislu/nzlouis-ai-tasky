/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProjectCard } from '@/components/stories/ProjectCard';
import { 
  mockProject, 
  mockApiResponses, 
  mockFetch, 
  testSetup,
  testUtils 
} from '@/lib/stories/testing/test-utils';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn()
  })
}));

describe('ProjectCard Component', () => {
  beforeEach(() => {
    testSetup.beforeEach();
  });

  afterEach(() => {
    testSetup.afterEach();
  });

  it('renders project information correctly', () => {
    render(
      <ProjectCard 
        project={mockProject}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByText('Test Project')).toBeInTheDocument();
    expect(screen.getByText('A test project for Stories')).toBeInTheDocument();
    expect(screen.getByText('TEST-PROJECT')).toBeInTheDocument();
  });

  it('shows connection status indicators', () => {
    const projectWithConnections = {
      ...mockProject,
      connections: [
        { platform: 'jira', status: 'connected' },
        { platform: 'trello', status: 'disconnected' }
      ]
    };

    render(
      <ProjectCard 
        project={projectWithConnections}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByText('Jira')).toBeInTheDocument();
    expect(screen.getByText('Trello')).toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', async () => {
    const onEdit = vi.fn();
    const user = userEvent.setup();

    render(
      <ProjectCard 
        project={mockProject}
        onEdit={onEdit}
        onDelete={vi.fn()}
      />
    );

    const editButton = screen.getByRole('button', { name: /edit/i });
    await user.click(editButton);

    expect(onEdit).toHaveBeenCalledWith(mockProject);
  });

  it('calls onDelete when delete button is clicked', async () => {
    const onDelete = vi.fn();
    const user = userEvent.setup();

    render(
      <ProjectCard 
        project={mockProject}
        onEdit={vi.fn()}
        onDelete={onDelete}
      />
    );

    const deleteButton = screen.getByRole('button', { name: /delete/i });
    await user.click(deleteButton);

    expect(onDelete).toHaveBeenCalledWith(mockProject.id);
  });

  it('displays document count when provided', () => {
    const projectWithDocs = {
      ...mockProject,
      documentCount: 5
    };

    render(
      <ProjectCard 
        project={projectWithDocs}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByText('5 documents')).toBeInTheDocument();
  });

  it('shows last sync information', () => {
    const projectWithSync = {
      ...mockProject,
      lastSyncAt: '2024-01-01T10:00:00Z',
      syncStatus: 'success'
    };

    render(
      <ProjectCard 
        project={projectWithSync}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByText(/synced/i)).toBeInTheDocument();
  });
});

describe('Story Format Validation', () => {
  it('validates correct story format', () => {
    const validStory = `- Story: User can login
  Description: As a user, I want to login so that I can access my account.
  Acceptance_Criteria:
    - [ ] User can enter credentials
    - [ ] System validates login
  Priority: High
  Labels: [auth]
  Assignees: John Doe
  Reporter: Product Manager`;

    expect(storyValidation.isValidStoryFormat(validStory)).toBe(true);
  });

  it('rejects invalid story format', () => {
    const invalidStory = `Just some random text without proper story format`;

    expect(storyValidation.isValidStoryFormat(invalidStory)).toBe(false);
  });

  it('counts stories correctly', () => {
    const multipleStories = `- Story: First story
  Description: First description
  Acceptance_Criteria:
    - [ ] First criterion

- Story: Second story
  Description: Second description
  Acceptance_Criteria:
    - [ ] Second criterion`;

    expect(storyValidation.countStories(multipleStories)).toBe(2);
  });
});

describe('API Integration', () => {
  beforeEach(() => {
    testSetup.beforeEach();
  });

  it('handles successful project fetch', async () => {
    global.fetch = mockFetch({
      '/api/stories/projects': mockApiResponses.projects.success
    });

    const response = await fetch('/api/stories/projects');
    const data = await response.json();

    expect(data.data).toEqual([mockProject]);
    expect(response.ok).toBe(true);
  });

  it('handles API errors gracefully', async () => {
    global.fetch = mockFetch({
      '/api/stories/projects': mockApiResponses.projects.error
    });

    const response = await fetch('/api/stories/projects');
    const data = await response.json();

    expect(data.error).toBe('Failed to fetch projects');
    expect(response.ok).toBe(false);
  });

  it('handles sync operation', async () => {
    global.fetch = mockFetch({
      'POST /api/stories/sync/jira': mockApiResponses.sync.success
    });

    const response = await fetch('/api/stories/sync/jira', {
      method: 'POST',
      body: JSON.stringify({ documentId: 'test-doc-1' })
    });
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.results.total).toBe(3);
    expect(data.results.synced).toBe(3);
  });
});

describe('Error Handling', () => {
  it('displays error message for network failures', () => {
    const error = new Error('Network error');
    error.name = 'NetworkError';

    const errorMessage = handleApiError(error);
    expect(errorMessage).toBe('Network error. Please check your internet connection.');
  });

  it('displays appropriate message for 401 errors', () => {
    const error = { status: 401 };

    const errorMessage = handleApiError(error);
    expect(errorMessage).toBe('Authentication required. Please log in again.');
  });

  it('displays appropriate message for 403 errors', () => {
    const error = { status: 403 };

    const errorMessage = handleApiError(error);
    expect(errorMessage).toBe('You do not have permission to perform this action.');
  });

  it('displays appropriate message for 404 errors', () => {
    const error = { status: 404 };

    const errorMessage = handleApiError(error);
    expect(errorMessage).toBe('The requested resource was not found.');
  });

  it('displays appropriate message for server errors', () => {
    const error = { status: 500 };

    const errorMessage = handleApiError(error);
    expect(errorMessage).toBe('Server error. Please try again later.');
  });
});

describe('Keyboard Shortcuts', () => {
  it('triggers save action on Cmd+S', () => {
    const onSave = vi.fn();
    
    useStoriesShortcuts({
      onSave,
      enabled: true
    });

    fireEvent.keyDown(document, {
      key: 's',
      metaKey: true
    });

    expect(onSave).toHaveBeenCalled();
  });

  it('triggers new story action on Cmd+N', () => {
    const onNewStory = vi.fn();
    
    useStoriesShortcuts({
      onNewStory,
      enabled: true
    });

    fireEvent.keyDown(document, {
      key: 'n',
      metaKey: true
    });

    expect(onNewStory).toHaveBeenCalled();
  });

  it('does not trigger shortcuts when disabled', () => {
    const onSave = vi.fn();
    
    useStoriesShortcuts({
      onSave,
      enabled: false
    });

    fireEvent.keyDown(document, {
      key: 's',
      metaKey: true
    });

    expect(onSave).not.toHaveBeenCalled();
  });
});

describe('Format Conversion', () => {
  it('converts markdown to ADF format', () => {
    const markdown = `# Heading
This is a paragraph with **bold** text.

- List item 1
- List item 2`;

    const adf = markdownToADF(markdown);
    
    expect(adf.type).toBe('doc');
    expect(adf.content).toHaveLength(3); // heading, paragraph, list
    expect(adf.content[0].type).toBe('heading');
    expect(adf.content[1].type).toBe('paragraph');
    expect(adf.content[2].type).toBe('bulletList');
  });

  it('converts markdown to Trello format', () => {
    const markdown = `# Story Title
Description of the story

## Acceptance Criteria
- [ ] First criterion
- [x] Second criterion (completed)`;

    const trelloCard = parseStoryToTrelloCard(markdown);
    
    expect(trelloCard.name).toBe('Story Title');
    expect(trelloCard.desc).toContain('Description of the story');
    expect(trelloCard.checklists).toHaveLength(1);
    expect(trelloCard.checklists[0].items).toHaveLength(2);
  });
});

// Import required functions for testing
import { storyValidation } from '@/lib/stories/testing/test-utils';
import { handleApiError } from '@/components/stories/ErrorBoundary';
import { useStoriesShortcuts } from '@/components/stories/KeyboardShortcuts';
import { markdownToADF } from '@/lib/stories/converters/markdown-to-adf';
import { parseStoryToTrelloCard } from '@/lib/stories/converters/markdown-to-trello';