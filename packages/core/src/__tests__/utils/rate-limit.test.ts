import { describe, it, expect, beforeEach } from "vitest";
import {
  checkRateLimit,
  incrementRateLimit,
  resetRateLimit,
} from "../../utils/rate-limit";

describe("Rate Limiting", () => {
  beforeEach(() => {
    // Reset rate limit store before each test
    resetRateLimit("test-ip");
  });

  it("should allow requests within limit", () => {
    const result = checkRateLimit("test-ip-1");
    expect(result.isLimited).toBe(false);
    expect(result.remaining).toBe(5);
  });

  it("should track failed attempts", () => {
    incrementRateLimit("test-ip-2");
    const result = checkRateLimit("test-ip-2");
    expect(result.remaining).toBe(4);
  });

  it("should block after max attempts", () => {
    // Make 5 failed attempts
    for (let i = 0; i < 5; i++) {
      incrementRateLimit("test-ip-3");
    }

    const result = checkRateLimit("test-ip-3");
    expect(result.isLimited).toBe(true);
    expect(result.remaining).toBe(0);
  });

  it("should reset after successful login", () => {
    incrementRateLimit("test-ip-4");
    incrementRateLimit("test-ip-4");

    resetRateLimit("test-ip-4");

    const result = checkRateLimit("test-ip-4");
    expect(result.isLimited).toBe(false);
    expect(result.remaining).toBe(5);
  });

  it("should have different limits for different IPs", () => {
    incrementRateLimit("ip-1");
    incrementRateLimit("ip-1");

    const result1 = checkRateLimit("ip-1");
    const result2 = checkRateLimit("ip-2");

    expect(result1.remaining).toBe(3);
    expect(result2.remaining).toBe(5);
  });

  it("should provide resetTime", () => {
    const result = checkRateLimit("test-ip-5");
    expect(result.resetTime).toBeGreaterThan(Date.now());
    expect(typeof result.resetTime).toBe("number");
  });
});
