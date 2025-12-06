/**
 * Simple in-memory rate limiter for login attempts
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Configuration
const MAX_ATTEMPTS = 5; // Maximum login attempts
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Check if IP/identifier is rate limited
 * @param identifier - IP address or other unique identifier
 * @returns Object with isLimited and remaining attempts
 */
export function checkRateLimit(identifier: string): {
  isLimited: boolean;
  remaining: number;
  resetTime: number;
} {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  // No entry or expired entry
  if (!entry || now > entry.resetTime) {
    rateLimitStore.set(identifier, {
      count: 0,
      resetTime: now + WINDOW_MS,
    });

    return {
      isLimited: false,
      remaining: MAX_ATTEMPTS,
      resetTime: now + WINDOW_MS,
    };
  }

  // Check if limit exceeded
  if (entry.count >= MAX_ATTEMPTS) {
    return {
      isLimited: true,
      remaining: 0,
      resetTime: entry.resetTime,
    };
  }

  return {
    isLimited: false,
    remaining: MAX_ATTEMPTS - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * Increment rate limit counter for identifier
 * @param identifier - IP address or other unique identifier
 */
export function incrementRateLimit(identifier: string): void {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  if (!entry || now > entry.resetTime) {
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + WINDOW_MS,
    });
  } else {
    entry.count++;
  }
}

/**
 * Reset rate limit for identifier (use after successful login)
 * @param identifier - IP address or other unique identifier
 */
export function resetRateLimit(identifier: string): void {
  rateLimitStore.delete(identifier);
}

/**
 * Clean up expired entries (should be called periodically)
 */
export function cleanupRateLimitStore(): void {
  const now = Date.now();
  for (const [identifier, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(identifier);
    }
  }
}

// Cleanup expired entries every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(cleanupRateLimitStore, 5 * 60 * 1000);
}
