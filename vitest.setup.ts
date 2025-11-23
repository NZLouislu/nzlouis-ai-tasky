import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Next.js modules
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/stories',
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('next/server', () => ({
  NextRequest: class NextRequest {
    constructor(url, init) {
      this.url = url;
      this.method = init?.method || 'GET';
      this.headers = new Headers(init?.headers);
      this._body = init?.body;
    }
    async json() {
      return JSON.parse(this._body);
    }
  },
  NextResponse: {
    json: (data, init) => ({
      json: async () => data,
      status: init?.status || 200,
      headers: new Headers(init?.headers),
    }),
  },
}));

vi.mock('next-auth/react', () => ({
  useSession: () => ({
    data: {
      user: {
        email: 'test@example.com',
        name: 'Test User',
      },
    },
    status: 'authenticated',
  }),
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

// Mock Supabase
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
    })),
  })),
}));

// Mock BlockNote editor
vi.mock('@blocknote/react', () => ({
  BlockNoteView: vi.fn(({ editor, onChange }) => {
    return React.createElement('div', {
      'data-testid': 'blocknote-editor',
      contentEditable: true,
      onInput: (e) => onChange?.((e.target as HTMLElement).textContent),
    });
  }),
  useBlockNote: vi.fn(() => ({
    document: [],
    insertBlocks: vi.fn(),
    updateBlock: vi.fn(),
    removeBlocks: vi.fn(),
    replaceBlocks: vi.fn(),
    focus: vi.fn(),
    blur: vi.fn(),
    isEditable: true,
  })),
}));

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
process.env.TASKY_SUPABASE_SERVICE_ROLE_KEY = 'test-tasky-service-role-key';
process.env.BLOG_SUPABASE_URL = 'https://blog-test.supabase.co';
process.env.BLOG_SUPABASE_SERVICE_ROLE_KEY = 'test-blog-service-role-key';
process.env.NEXTAUTH_SECRET = 'test-secret';
process.env.NEXTAUTH_URL = 'http://localhost:3000';

// Global test setup
beforeEach(() => {
  // Clear all mocks before each test
  vi.clearAllMocks();
  
  // Reset fetch mock
  global.fetch = vi.fn();
  
  // Mock console methods to reduce noise
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  // Restore all mocks after each test
  vi.restoreAllMocks();
});

// Add React import for JSX
import React from 'react';