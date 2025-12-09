/**
 * Rate limiting utility for preventing brute force attacks
 * Uses in-memory storage for simplicity (use Redis in production for distributed systems)
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
  blockedUntil?: number;
}

// Store login attempts (in production, use Redis)
const loginAttempts = new Map<string, RateLimitEntry>();

// Configuration
const RATE_LIMIT_CONFIG = {
  maxAttempts: 5,
  windowMinutes: 15,
  blockMinutes: 60,
};

/**
 * Check if a request is allowed based on rate limiting
 * @param identifier - Unique identifier (e.g., IP:username)
 * @returns Rate limit status
 */
export function checkRateLimit(identifier: string): {
  allowed: boolean;
  remainingAttempts: number;
  resetTime: number;
  blockedUntil?: number;
} {
  const now = Date.now();
  const entry = loginAttempts.get(identifier);

  // Check if currently blocked
  if (entry?.blockedUntil && now < entry.blockedUntil) {
    return {
      allowed: false,
      remainingAttempts: 0,
      resetTime: entry.resetTime,
      blockedUntil: entry.blockedUntil,
    };
  }

  // Reset counter if window expired
  if (!entry || now > entry.resetTime) {
    const resetTime = now + RATE_LIMIT_CONFIG.windowMinutes * 60 * 1000;
    loginAttempts.set(identifier, {
      count: 0,
      resetTime,
    });
    return {
      allowed: true,
      remainingAttempts: RATE_LIMIT_CONFIG.maxAttempts,
      resetTime,
    };
  }

  // Check if limit exceeded
  if (entry.count >= RATE_LIMIT_CONFIG.maxAttempts) {
    // Block for specified duration
    const blockedUntil = now + RATE_LIMIT_CONFIG.blockMinutes * 60 * 1000;
    loginAttempts.set(identifier, {
      ...entry,
      blockedUntil,
    });

    console.log(
      `[Rate Limit] Blocked ${identifier} until ${new Date(blockedUntil).toISOString()}`
    );

    return {
      allowed: false,
      remainingAttempts: 0,
      resetTime: entry.resetTime,
      blockedUntil,
    };
  }

  return {
    allowed: true,
    remainingAttempts: RATE_LIMIT_CONFIG.maxAttempts - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * Record a login attempt
 * @param identifier - Unique identifier
 * @param success - Whether the login was successful
 */
export function recordLoginAttempt(identifier: string, success: boolean): void {
  if (success) {
    // Clear attempts on successful login
    loginAttempts.delete(identifier);
    console.log(`[Rate Limit] Cleared attempts for ${identifier} (successful login)`);
    return;
  }

  // Increment failure count
  const entry = loginAttempts.get(identifier);
  if (entry) {
    entry.count++;
    loginAttempts.set(identifier, entry);
    console.log(
      `[Rate Limit] Failed attempt for ${identifier}, count: ${entry.count}/${RATE_LIMIT_CONFIG.maxAttempts}`
    );
  }
}

/**
 * Get progressive delay based on attempt count (anti-brute-force)
 * @param attemptCount - Number of failed attempts
 * @returns Delay in milliseconds
 */
export function getBackoffDelay(attemptCount: number): number {
  const delays: Record<number, number> = {
    1: 0, // First attempt: no delay
    2: 1000, // 1 second
    3: 3000, // 3 seconds
    4: 10000, // 10 seconds
    5: 30000, // 30 seconds
  };

  const key = Math.min(attemptCount, 5);
  return key in delays ? delays[key] : 30000;
}

/**
 * Clean up expired entries (prevent memory leak)
 * Should be called periodically
 */
export function cleanupExpiredEntries(): void {
  const now = Date.now();
  let cleaned = 0;

  for (const [key, entry] of loginAttempts.entries()) {
    const isExpired = now > entry.resetTime;
    const isUnblocked = !entry.blockedUntil || now > entry.blockedUntil;

    if (isExpired && isUnblocked) {
      loginAttempts.delete(key);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    console.log(`[Rate Limit] Cleaned up ${cleaned} expired entries`);
  }
}

// Auto cleanup every hour
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupExpiredEntries, 60 * 60 * 1000);
}

/**
 * Get current rate limit stats (for testing/debugging)
 */
export function getRateLimitStats(identifier: string): RateLimitEntry | undefined {
  return loginAttempts.get(identifier);
}

/**
 * Clear all rate limit data (for testing)
 */
export function clearAllRateLimits(): void {
  loginAttempts.clear();
  console.log('[Rate Limit] Cleared all rate limit data');
}
