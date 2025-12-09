/**
 * Tests for rate limiting functionality
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  checkRateLimit,
  recordLoginAttempt,
  getBackoffDelay,
  clearAllRateLimits,
  getRateLimitStats,
} from '../rate-limit';

describe('Rate Limit', () => {
  beforeEach(() => {
    // Clear all rate limits before each test
    clearAllRateLimits();
  });

  describe('checkRateLimit', () => {
    it('should allow requests within limit', () => {
      const identifier = 'test-user-1';
      const result = checkRateLimit(identifier);

      expect(result.allowed).toBe(true);
      expect(result.remainingAttempts).toBe(5);
      expect(result.resetTime).toBeGreaterThan(Date.now());
    });

    it('should track multiple attempts', () => {
      const identifier = 'test-user-2';

      // First attempt
      checkRateLimit(identifier);
      recordLoginAttempt(identifier, false);

      // Second attempt
      const result = checkRateLimit(identifier);
      expect(result.allowed).toBe(true);
      expect(result.remainingAttempts).toBe(4);
    });

    it('should block after max attempts', () => {
      const identifier = 'test-user-3';

      // Simulate 5 failed attempts
      for (let i = 0; i < 5; i++) {
        checkRateLimit(identifier);
        recordLoginAttempt(identifier, false);
      }

      // 6th attempt should be blocked
      const result = checkRateLimit(identifier);
      expect(result.allowed).toBe(false);
      expect(result.remainingAttempts).toBe(0);
      expect(result.blockedUntil).toBeDefined();
      expect(result.blockedUntil).toBeGreaterThan(Date.now());
    });

    it('should clear attempts on successful login', () => {
      const identifier = 'test-user-4';

      // Failed attempts
      checkRateLimit(identifier);
      recordLoginAttempt(identifier, false);
      checkRateLimit(identifier);
      recordLoginAttempt(identifier, false);

      // Successful login
      recordLoginAttempt(identifier, true);

      // Should reset
      const result = checkRateLimit(identifier);
      expect(result.allowed).toBe(true);
      expect(result.remainingAttempts).toBe(5);
    });

    it('should handle different identifiers independently', () => {
      const user1 = 'test-user-5';
      const user2 = 'test-user-6';

      // User 1 fails 3 times
      for (let i = 0; i < 3; i++) {
        checkRateLimit(user1);
        recordLoginAttempt(user1, false);
      }

      // User 2 should not be affected
      const result = checkRateLimit(user2);
      expect(result.allowed).toBe(true);
      expect(result.remainingAttempts).toBe(5);

      // User 1 should have 2 attempts left
      const result1 = checkRateLimit(user1);
      expect(result1.remainingAttempts).toBe(2);
    });
  });

  describe('getBackoffDelay', () => {
    it('should return 0 for first attempt', () => {
      expect(getBackoffDelay(1)).toBe(0);
    });

    it('should increase delay with attempts', () => {
      expect(getBackoffDelay(2)).toBe(1000);
      expect(getBackoffDelay(3)).toBe(3000);
      expect(getBackoffDelay(4)).toBe(10000);
      expect(getBackoffDelay(5)).toBe(30000);
    });

    it('should cap at maximum delay', () => {
      expect(getBackoffDelay(6)).toBe(30000);
      expect(getBackoffDelay(10)).toBe(30000);
    });
  });

  describe('getRateLimitStats', () => {
    it('should return undefined for new identifier', () => {
      const stats = getRateLimitStats('new-user');
      expect(stats).toBeUndefined();
    });

    it('should return stats for existing identifier', () => {
      const identifier = 'test-user-7';
      checkRateLimit(identifier);
      recordLoginAttempt(identifier, false);

      const stats = getRateLimitStats(identifier);
      expect(stats).toBeDefined();
      expect(stats?.count).toBe(1);
      expect(stats?.resetTime).toBeGreaterThan(Date.now());
    });
  });

  describe('clearAllRateLimits', () => {
    it('should clear all rate limit data', () => {
      const user1 = 'test-user-8';
      const user2 = 'test-user-9';

      // Create some rate limit entries
      checkRateLimit(user1);
      recordLoginAttempt(user1, false);
      checkRateLimit(user2);
      recordLoginAttempt(user2, false);

      // Clear all
      clearAllRateLimits();

      // Both should be reset
      const result1 = checkRateLimit(user1);
      const result2 = checkRateLimit(user2);

      expect(result1.remainingAttempts).toBe(5);
      expect(result2.remainingAttempts).toBe(5);
    });
  });
});
