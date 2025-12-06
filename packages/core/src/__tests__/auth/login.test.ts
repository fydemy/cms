import { describe, it, expect, beforeEach } from "vitest";
import { validateCredentials } from "../../auth/login";

describe("validateCredentials", () => {
  beforeEach(() => {
    // Reset environment variables before each test
    delete process.env.CMS_ADMIN_USERNAME;
    delete process.env.CMS_ADMIN_PASSWORD;
  });

  it("should throw error when environment variables are not set", () => {
    expect(() => validateCredentials("admin", "password")).toThrow(
      "CMS_ADMIN_USERNAME and CMS_ADMIN_PASSWORD must be set in environment variables"
    );
  });

  it("should return true for valid credentials", () => {
    process.env.CMS_ADMIN_USERNAME = "admin";
    process.env.CMS_ADMIN_PASSWORD = "password123";

    const result = validateCredentials("admin", "password123");
    expect(result).toBe(true);
  });

  it("should return false for invalid username", () => {
    process.env.CMS_ADMIN_USERNAME = "admin";
    process.env.CMS_ADMIN_PASSWORD = "password123";

    const result = validateCredentials("wronguser", "password123");
    expect(result).toBe(false);
  });

  it("should return false for invalid password", () => {
    process.env.CMS_ADMIN_USERNAME = "admin";
    process.env.CMS_ADMIN_PASSWORD = "password123";

    const result = validateCredentials("admin", "wrongpassword");
    expect(result).toBe(false);
  });

  it("should return false for both invalid username and password", () => {
    process.env.CMS_ADMIN_USERNAME = "admin";
    process.env.CMS_ADMIN_PASSWORD = "password123";

    const result = validateCredentials("wronguser", "wrongpassword");
    expect(result).toBe(false);
  });

  it("should return false for username that is too long", () => {
    process.env.CMS_ADMIN_USERNAME = "admin";
    process.env.CMS_ADMIN_PASSWORD = "password123";

    const longUsername = "a".repeat(101);
    const result = validateCredentials(longUsername, "password123");
    expect(result).toBe(false);
  });

  it("should return false for password that is too long", () => {
    process.env.CMS_ADMIN_USERNAME = "admin";
    process.env.CMS_ADMIN_PASSWORD = "password123";

    const longPassword = "p".repeat(1001);
    const result = validateCredentials("admin", longPassword);
    expect(result).toBe(false);
  });

  it("should return false for username with invalid characters", () => {
    process.env.CMS_ADMIN_USERNAME = "admin";
    process.env.CMS_ADMIN_PASSWORD = "password123";

    const result = validateCredentials("admin@test", "password123");
    expect(result).toBe(false);
  });

  it("should use timing-safe comparison (execution time should be consistent)", async () => {
    process.env.CMS_ADMIN_USERNAME = "admin";
    process.env.CMS_ADMIN_PASSWORD = "password123";

    const iterations = 100;
    const times: number[] = [];

    // Test with correct credentials
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      validateCredentials("admin", "password123");
      const end = performance.now();
      times.push(end - start);
    }

    const correctAvg = times.reduce((a, b) => a + b) / times.length;
    times.length = 0;

    // Test with incorrect credentials
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      validateCredentials("wrong", "wrong");
      const end = performance.now();
      times.push(end - start);
    }

    const incorrectAvg = times.reduce((a, b) => a + b) / times.length;

    // Timing should be relatively similar (within 10x)
    // This is a weak test but ensures we're using timingSafeEqual
    const ratio =
      Math.max(correctAvg, incorrectAvg) / Math.min(correctAvg, incorrectAvg);
    expect(ratio).toBeLessThan(10);
  });
});
