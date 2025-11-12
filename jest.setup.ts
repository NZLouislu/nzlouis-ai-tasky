import "@testing-library/jest-dom";
// Remove TextEncoder and TextDecoder imports as they are available in Node.js 16+

// Add TransformStream polyfill for AI SDK
if (typeof global.TransformStream === 'undefined') {
  const streamWeb = require('stream/web');
  global.TransformStream = streamWeb.TransformStream;
}

// Mock fetch API for testing
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(""),
    ok: true,
  } as Response)
);

// Mock other browser APIs only if window is defined
if (typeof window !== "undefined") {
  Object.defineProperty(window, "navigator", {
    value: {
      sendBeacon: jest.fn(),
    },
    writable: true,
  });

  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: jest.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(), // deprecated
      removeListener: jest.fn(), // deprecated
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
}

// TextEncoder and TextDecoder are available globally in Node.js 16+
// No need to manually assign them

// Mock next/image for all tests
jest.mock("next/image", () => {
  return {
    __esModule: true,
    default: function MockImage(props: any) {
      // Return a plain object instead of JSX
      return {
        $$typeof: Symbol.for("react.element"),
        type: "img",
        key: null,
        ref: null,
        props: { ...props, src: props.src || "" },
        _owner: null,
      };
    },
  };
});

// Mock next/dynamic for all tests
jest.mock("next/dynamic", () => {
  return () => {
    // Return a plain object instead of JSX
    return {
      $$typeof: Symbol.for("react.element"),
      type: "div",
      key: null,
      ref: null,
      props: { children: "Dynamic Component" },
      _owner: null,
    };
  };
});

// Set mock environment variables for testing to avoid warnings
process.env.TASKY_SUPABASE_URL = "https://test.supabase.co";
process.env.TASKY_SUPABASE_ANON_KEY = "test-anon-key";
process.env.TASKY_SUPABASE_SERVICE_ROLE_KEY = "test-service-key";
process.env.BLOG_SUPABASE_URL = "https://test-blog.supabase.co";
process.env.BLOG_SUPABASE_SERVICE_ROLE_KEY = "test-blog-service-key";

// Mock Supabase clients to avoid multiple instances warning
jest.mock("@supabase/supabase-js", () => {
  return {
    createClient: jest.fn().mockReturnValue({
      auth: {
        getSession: jest
          .fn()
          .mockResolvedValue({ data: { session: null }, error: null }),
        signInWithPassword: jest.fn().mockResolvedValue({
          data: { user: null, session: null },
          error: null,
        }),
        signOut: jest.fn().mockResolvedValue({ error: null }),
      },
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
      range: jest.fn().mockReturnThis(),
    }),
  };
});

// Mock next-auth
jest.mock("next-auth", () => ({
  default: jest.fn(),
}));

jest.mock("next-auth/react", () => ({
  useSession: jest.fn(() => ({
    data: null,
    status: "unauthenticated",
  })),
  signIn: jest.fn(),
  signOut: jest.fn(),
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
}));
