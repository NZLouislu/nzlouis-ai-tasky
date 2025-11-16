/**
 * Stories Testing Utilities
 * Provides testing helpers and mocks for Stories components
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

// Mock data for testing
export const mockProject = {
  id: 'test-project-1',
  name: 'Test Project',
  description: 'A test project for Stories',
  user_id: 'test-user@example.com',
  google_account_email: 'test-user@example.com',
  platform_project_id: 'TEST-PROJECT',
  project_metadata: {
    jira_url: 'https://test.atlassian.net',
    trello_board_id: 'test-board-123'
  },
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
};

export const mockDocument = {
  id: 'test-doc-1',
  project_id: 'test-project-1',
  title: 'Test Stories Document',
  content: [
    {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: '- Story: User can login\n  Description: As a user, I want to login so that I can access my account.\n  Acceptance_Criteria:\n    - [ ] User can enter email and password\n    - [ ] System validates credentials\n    - [ ] User is redirected to dashboard\n  Priority: High\n  Labels: [authentication, security]\n  Assignees: John Doe\n  Reporter: Product Manager'
        }
      ]
    }
  ],
  document_type: 'stories',
  last_synced_at: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
};

export const mockConnection = {
  id: 'test-conn-1',
  user_id: 'test-user@example.com',
  platform: 'jira',
  google_account_email: 'test-user@example.com',
  connection_status: 'connected',
  access_token_encrypted: 'encrypted-token',
  refresh_token_encrypted: 'encrypted-refresh-token',
  expires_at: '2024-12-31T23:59:59Z',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
};

export const mockSyncHistory = {
  id: 'test-sync-1',
  document_id: 'test-doc-1',
  sync_direction: 'to_platform',
  platform: 'jira',
  sync_status: 'success',
  items_synced: 3,
  items_failed: 0,
  sync_details: {
    results: [
      { success: true, issueKey: 'TEST-1' },
      { success: true, issueKey: 'TEST-2' },
      { success: true, issueKey: 'TEST-3' }
    ]
  },
  started_at: '2024-01-01T10:00:00Z',
  completed_at: '2024-01-01T10:05:00Z'
};

// Mock API responses
export const mockApiResponses = {
  projects: {
    success: {
      data: [mockProject],
      error: null
    },
    error: {
      data: null,
      error: 'Failed to fetch projects'
    }
  },
  documents: {
    success: {
      data: [mockDocument],
      error: null
    },
    error: {
      data: null,
      error: 'Failed to fetch documents'
    }
  },
  sync: {
    success: {
      success: true,
      syncId: 'test-sync-1',
      results: {
        total: 3,
        synced: 3,
        failed: 0,
        details: [
          { success: true, issueKey: 'TEST-1' },
          { success: true, issueKey: 'TEST-2' },
          { success: true, issueKey: 'TEST-3' }
        ]
      }
    },
    error: {
      error: 'Sync failed'
    }
  }
};

// Mock fetch function
export function mockFetch(responses: Record<string, any>) {
  return vi.fn().mockImplementation((url: string, options?: RequestInit) => {
    const method = options?.method || 'GET';
    const key = `${method} ${url}`;
    
    const response = responses[key] || responses[url];
    
    if (!response) {
      return Promise.resolve({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ error: 'Not found' })
      });
    }
    
    return Promise.resolve({
      ok: !response.error,
      status: response.error ? 400 : 200,
      json: () => Promise.resolve(response)
    });
  });
}

// Mock Supabase client
export function createMockSupabaseClient() {
  const mockSelect = vi.fn().mockReturnThis();
  const mockInsert = vi.fn().mockReturnThis();
  const mockUpdate = vi.fn().mockReturnThis();
  const mockDelete = vi.fn().mockReturnThis();
  const mockEq = vi.fn().mockReturnThis();
  const mockSingle = vi.fn();
  const mockOrder = vi.fn().mockReturnThis();
  const mockLimit = vi.fn().mockReturnThis();

  const mockFrom = vi.fn().mockReturnValue({
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
    eq: mockEq,
    single: mockSingle,
    order: mockOrder,
    limit: mockLimit
  });

  return {
    from: mockFrom,
    mocks: {
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
      eq: mockEq,
      single: mockSingle,
      order: mockOrder,
      limit: mockLimit,
      from: mockFrom
    }
  };
}

// Test utilities
export const testUtils = {
  // Render component with providers
  renderWithProviders: (component: React.ReactElement) => {
    // Add any providers needed for testing (e.g., React Query, Context providers)
    return render(component);
  },

  // Wait for element to appear
  waitForElement: async (selector: string) => {
    return await waitFor(() => screen.getByTestId(selector));
  },

  // Fill form field
  fillField: async (label: string, value: string) => {
    const user = userEvent.setup();
    const field = screen.getByLabelText(label);
    await user.clear(field);
    await user.type(field, value);
  },

  // Click button
  clickButton: async (text: string) => {
    const user = userEvent.setup();
    const button = screen.getByRole('button', { name: text });
    await user.click(button);
  },

  // Wait for API call
  waitForApiCall: async (mockFn: any, timeout = 5000) => {
    return await waitFor(() => expect(mockFn).toHaveBeenCalled(), { timeout });
  }
};

// Story format validation helpers
export const storyValidation = {
  isValidStoryFormat: (content: string): boolean => {
    const storyPattern = /^- Story: .+/m;
    const descriptionPattern = /Description: .+/m;
    const criteriaPattern = /Acceptance_Criteria:/m;
    
    return storyPattern.test(content) && 
           descriptionPattern.test(content) && 
           criteriaPattern.test(content);
  },

  extractStories: (content: string): string[] => {
    return content.split(/^- Story:/m).filter(section => section.trim());
  },

  countStories: (content: string): number => {
    const matches = content.match(/^- Story:/gm);
    return matches ? matches.length : 0;
  }
};

// Mock BlockNote editor
export function createMockBlockNoteEditor() {
  const mockEditor = {
    document: [],
    insertBlocks: vi.fn(),
    updateBlock: vi.fn(),
    removeBlocks: vi.fn(),
    replaceBlocks: vi.fn(),
    focus: vi.fn(),
    blur: vi.fn(),
    isEditable: true,
    onChange: vi.fn()
  };

  return mockEditor;
}

// Test data generators
export const generators = {
  project: (overrides = {}) => ({
    ...mockProject,
    ...overrides,
    id: `project-${Math.random().toString(36).substr(2, 9)}`
  }),

  document: (overrides = {}) => ({
    ...mockDocument,
    ...overrides,
    id: `doc-${Math.random().toString(36).substr(2, 9)}`
  }),

  story: (title = 'Test Story') => `- Story: ${title}
  Description: As a user, I want to ${title.toLowerCase()} so that I can achieve my goals.
  Acceptance_Criteria:
    - [ ] Criterion 1
    - [ ] Criterion 2
    - [ ] Criterion 3
  Priority: Medium
  Labels: [test]
  Assignees: Test User
  Reporter: Test Reporter`,

  multipleStories: (count = 3) => {
    return Array.from({ length: count }, (_, i) => 
      generators.story(`Test Story ${i + 1}`)
    ).join('\n\n');
  }
};

// Custom matchers for testing
export const customMatchers = {
  toHaveStoryCount: (content: string, expectedCount: number) => {
    const actualCount = storyValidation.countStories(content);
    return {
      pass: actualCount === expectedCount,
      message: () => `Expected ${expectedCount} stories, but found ${actualCount}`
    };
  },

  toBeValidStoryFormat: (content: string) => {
    const isValid = storyValidation.isValidStoryFormat(content);
    return {
      pass: isValid,
      message: () => `Expected valid story format, but content is invalid`
    };
  }
};

// Setup and teardown helpers
export const testSetup = {
  beforeEach: () => {
    // Clear all mocks
    vi.clearAllMocks();
    
    // Reset fetch mock
    global.fetch = vi.fn();
    
    // Mock console methods to reduce noise in tests
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  },

  afterEach: () => {
    // Restore console methods
    vi.restoreAllMocks();
  }
};

// Integration test helpers
export const integrationHelpers = {
  createFullStoryWorkflow: async () => {
    // Simulate complete story creation workflow
    const user = userEvent.setup();
    
    // Create project
    await user.click(screen.getByText('New Project'));
    await testUtils.fillField('Project Name', 'Test Project');
    await user.click(screen.getByText('Create'));
    
    // Create document
    await user.click(screen.getByText('New Document'));
    await testUtils.fillField('Document Title', 'Test Stories');
    await user.click(screen.getByText('Create'));
    
    // Add story content
    const editor = screen.getByRole('textbox');
    await user.type(editor, generators.story('User Login'));
    
    // Save
    await user.click(screen.getByText('Save'));
  },

  simulateSync: async (platform: 'jira' | 'trello') => {
    const user = userEvent.setup();
    
    // Open sync dialog
    await user.click(screen.getByText(`Sync to ${platform === 'jira' ? 'Jira' : 'Trello'}`));
    
    // Start sync
    await user.click(screen.getByText('Start Sync'));
    
    // Wait for completion
    await waitFor(() => screen.getByText('Sync Complete'));
  }
};