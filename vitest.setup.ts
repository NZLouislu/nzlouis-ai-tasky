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
    url: string;
    method: string;
    headers: Headers;
    _body: string;
    _cookies: Map<string, { value: string }>;
    
    constructor(url: string, init?: { method?: string; headers?: Record<string, string>; body?: string }) {
      this.url = url;
      this.method = init?.method || 'GET';
      this.headers = new Headers(init?.headers);
      this._body = init?.body || '';
      this._cookies = new Map();
      
      // Parse cookies from headers
      const cookieHeader = this.headers.get('Cookie');
      if (cookieHeader) {
        cookieHeader.split(';').forEach(cookie => {
          const [name, value] = cookie.trim().split('=');
          if (name && value) {
            this._cookies.set(name, { value });
          }
        });
      }
    }
    
    async json() {
      return JSON.parse(this._body);
    }
    
    get cookies() {
      const cookies = this._cookies;
      return {
        get: (name: string) => cookies.get(name),
      };
    }

    get nextUrl() {
      return new URL(this.url);
    }
  },
  NextResponse: {
    json: (data: unknown, init?: { status?: number; headers?: Record<string, string> }) => {
      const responseCookies = new Map<string, { value: string; options?: unknown }>();
      const response = {
        json: async () => data,
        status: init?.status || 200,
        headers: new Headers(init?.headers),
        cookies: {
          set: (name: string, value: string, options?: unknown) => {
            responseCookies.set(name, { value, options });
          },
          get: (name: string) => responseCookies.get(name),
          delete: (name: string) => responseCookies.delete(name),
        },
      };
      return response;
    },
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
      onInput: (e: Event) => onChange?.((e.target as HTMLElement).textContent),
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

// Admin authentication environment variables
process.env.ADMIN_USERNAME = 'test_admin';
process.env.ADMIN_PASSWORD = 'test_password';
process.env.ADMIN_PASSWORD_HASH = '';

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