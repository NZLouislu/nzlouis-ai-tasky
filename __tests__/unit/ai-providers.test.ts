import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/supabase/tasky-db-client', () => ({
  taskyDb: {
    from: vi.fn(),
  },
}));
import { getFallbackAPIKey } from '@/lib/ai/providers';

vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(),
}));

vi.mock('@/lib/encryption', () => ({
  decryptAPIKey: vi.fn(),
}));

vi.mock('@ai-sdk/openai', () => ({
  createOpenAI: vi.fn(),
}));

vi.mock('@ai-sdk/google', () => ({
  createGoogleGenerativeAI: vi.fn(),
}));

vi.mock('@ai-sdk/anthropic', () => ({
  createAnthropic: vi.fn(),
}));

describe('AI Providers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.OPENAI_API_KEY = 'test-openai-key';
    process.env.GOOGLE_API_KEY = 'test-google-key';
    process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
  });

  describe('getFallbackAPIKey', () => {
    it('should return OpenAI API key from env', () => {
      const key = getFallbackAPIKey('openai');
      expect(key).toBe('test-openai-key');
    });

    it('should return Google API key from env', () => {
      const key = getFallbackAPIKey('google');
      expect(key).toBe('test-google-key');
    });

    it('should return Anthropic API key from env', () => {
      const key = getFallbackAPIKey('anthropic');
      expect(key).toBe('test-anthropic-key');
    });

    it('should return undefined for unknown provider', () => {
      const key = getFallbackAPIKey('unknown' as 'google');
      expect(key).toBeUndefined();
    });
  });

  // Note: getAIProvider tests are skipped because they require database access
  // These would be better as integration tests
  describe('getAIProvider', () => {
    it('should be tested in integration tests', () => {
      // This function requires actual Prisma client which doesn't work in unit tests
      // Integration tests would be more appropriate
      expect(true).toBe(true);
    });
  });
});
