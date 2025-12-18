import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/supabase/tasky-db-client', () => ({
  taskyDb: {
    from: vi.fn(),
  },
}));
import {
  isValidModel,
  getAvailableModels,
  getDefaultModel,
  MODEL_MAPPINGS
} from '@/lib/ai/models';

describe('AI Models', () => {
  describe('isValidModel', () => {
    it('should return true for valid Google models', () => {
      expect(isValidModel('google', 'gemini-3-flash-preview')).toBe(true);
      expect(isValidModel('google', 'gemini-1.5-flash')).toBe(true);
      expect(isValidModel('google', 'gemini-2.5-pro')).toBe(true);
    });

    it('should return true for valid OpenAI models', () => {
      expect(isValidModel('openai', 'gpt-4o')).toBe(true);
      expect(isValidModel('openai', 'gpt-4o-mini')).toBe(true);
    });

    it('should return true for valid Anthropic models', () => {
      expect(isValidModel('anthropic', 'claude-4-opus')).toBe(true);
      expect(isValidModel('anthropic', 'claude-sonnet')).toBe(true);
    });

    it('should return true for models with slash (OpenRouter format)', () => {
      expect(isValidModel('openrouter', 'deepseek/deepseek-r1')).toBe(true);
    });

    it('should return false for invalid models', () => {
      expect(isValidModel('google', 'invalid-model')).toBe(false);
      expect(isValidModel('openai', 'nonexistent')).toBe(false);
    });
  });

  describe('getAvailableModels', () => {
    it('should return all Google models', () => {
      const models = getAvailableModels('google');
      expect(models).toContain('gemini-3-flash-preview');
      expect(models).toContain('gemini-1.5-flash');
      expect(models).toContain('gemini-2.5-pro');
      expect(models.length).toBeGreaterThan(0);
    });

    it('should return all OpenAI models', () => {
      const models = getAvailableModels('openai');
      expect(models).toContain('gpt-4o');
      expect(models).toContain('gpt-4o-mini');
      expect(models.length).toBeGreaterThan(0);
    });

    it('should return all Anthropic models', () => {
      const models = getAvailableModels('anthropic');
      expect(models).toContain('claude-4-opus');
      expect(models).toContain('claude-sonnet');
      expect(models.length).toBeGreaterThan(0);
    });
  });

  describe('getDefaultModel', () => {
    it('should return first model for each provider', () => {
      const googleDefault = getDefaultModel('google');
      expect(googleDefault).toBe(Object.keys(MODEL_MAPPINGS.google)[0]);

      const openaiDefault = getDefaultModel('openai');
      expect(openaiDefault).toBe(Object.keys(MODEL_MAPPINGS.openai)[0]);

      const anthropicDefault = getDefaultModel('anthropic');
      expect(anthropicDefault).toBe(Object.keys(MODEL_MAPPINGS.anthropic)[0]);
    });
  });

  describe('MODEL_MAPPINGS', () => {
    it('should have mappings for all providers', () => {
      expect(MODEL_MAPPINGS).toHaveProperty('google');
      expect(MODEL_MAPPINGS).toHaveProperty('openai');
      expect(MODEL_MAPPINGS).toHaveProperty('anthropic');
      expect(MODEL_MAPPINGS).toHaveProperty('openrouter');
      expect(MODEL_MAPPINGS).toHaveProperty('kilo');
    });

    it('should have at least one model per provider', () => {
      Object.entries(MODEL_MAPPINGS).forEach(([, models]) => {
        expect(Object.keys(models).length).toBeGreaterThan(0);
      });
    });
  });
});
