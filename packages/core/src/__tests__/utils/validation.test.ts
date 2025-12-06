import { describe, it, expect } from "vitest";
import {
  validateFilePath,
  validateUsername,
  validatePassword,
  validateFileSize,
  sanitizeFrontmatter,
  MAX_USERNAME_LENGTH,
  MAX_PASSWORD_LENGTH,
  MAX_FILE_SIZE,
} from "../../utils/validation";

describe("validateFilePath", () => {
  it("should accept valid file paths", () => {
    expect(validateFilePath("blog/post.md")).toBe("blog/post.md");
    expect(validateFilePath("content/pages/about.md")).toBe(
      "content/pages/about.md"
    );
  });

  it("should reject directory traversal attempts", () => {
    expect(() => validateFilePath("../etc/passwd")).toThrow(
      "Invalid file path: directory traversal detected"
    );
    expect(() => validateFilePath("blog/../../etc/passwd")).toThrow();
  });

  it("should reject absolute paths", () => {
    expect(() => validateFilePath("/etc/passwd")).toThrow(
      "Invalid file path: directory traversal detected"
    );
  });

  it("should reject null bytes", () => {
    expect(() => validateFilePath("blog/post\x00.md")).toThrow(
      "Invalid file path: null byte detected"
    );
  });

  it("should reject dangerous characters", () => {
    expect(() => validateFilePath("blog/post<script>.md")).toThrow(
      "Invalid file path: contains dangerous characters"
    );
  });

  it("should reject Windows reserved names", () => {
    expect(() => validateFilePath("con.md")).toThrow(
      "Invalid file path: contains dangerous characters"
    );
    expect(() => validateFilePath("prn.md")).toThrow();
  });
});

describe("validateUsername", () => {
  it("should accept valid usernames", () => {
    expect(validateUsername("admin")).toBe(true);
    expect(validateUsername("user_123")).toBe(true);
    expect(validateUsername("test-user")).toBe(true);
  });

  it("should reject empty username", () => {
    expect(() => validateUsername("")).toThrow("Username is required");
  });

  it("should reject username that is too long", () => {
    const longUsername = "a".repeat(MAX_USERNAME_LENGTH + 1);
    expect(() => validateUsername(longUsername)).toThrow(
      `Username must be ${MAX_USERNAME_LENGTH} characters or less`
    );
  });

  it("should reject username with invalid characters", () => {
    expect(() => validateUsername("admin@test")).toThrow(
      "Username must contain only letters, numbers, underscores, and hyphens"
    );
    expect(() => validateUsername("admin test")).toThrow();
    expect(() => validateUsername("admin!")).toThrow();
  });
});

describe("validatePassword", () => {
  it("should accept valid passwords", () => {
    expect(validatePassword("password123")).toBe(true);
    expect(validatePassword("P@ssw0rd!")).toBe(true);
  });

  it("should reject empty password", () => {
    expect(() => validatePassword("")).toThrow("Password is required");
  });

  it("should reject password that is too long", () => {
    const longPassword = "p".repeat(MAX_PASSWORD_LENGTH + 1);
    expect(() => validatePassword(longPassword)).toThrow(
      `Password must be ${MAX_PASSWORD_LENGTH} characters or less`
    );
  });
});

describe("validateFileSize", () => {
  it("should accept files within size limit", () => {
    expect(validateFileSize(1024)).toBe(true);
    expect(validateFileSize(MAX_FILE_SIZE - 1)).toBe(true);
  });

  it("should reject files exceeding size limit", () => {
    expect(() => validateFileSize(MAX_FILE_SIZE + 1)).toThrow(
      `File size exceeds maximum allowed size of ${
        MAX_FILE_SIZE / 1024 / 1024
      }MB`
    );
  });
});

describe("sanitizeFrontmatter", () => {
  it("should keep valid data", () => {
    const data = {
      title: "Hello World",
      date: "2024-01-01",
      published: true,
      views: 100,
    };

    const result = sanitizeFrontmatter(data);
    expect(result).toEqual(data);
  });

  it("should remove null bytes from strings", () => {
    const data = {
      title: "Hello\x00World",
    };

    const result = sanitizeFrontmatter(data);
    expect(result.title).toBe("HelloWorld");
  });

  it("should skip invalid keys", () => {
    const data = {
      "valid-key": "value",
      "invalid key!": "value",
    };

    const result = sanitizeFrontmatter(data);
    expect(result).toEqual({ "valid-key": "value" });
  });

  it("should handle arrays", () => {
    const data = {
      tags: ["tag1", "tag2", "tag3\x00"],
    };

    const result = sanitizeFrontmatter(data);
    expect(result.tags).toEqual(["tag1", "tag2", "tag3"]);
  });

  it("should handle nested objects", () => {
    const data = {
      meta: {
        author: "John\x00Doe",
        category: "Tech",
      },
    };

    const result = sanitizeFrontmatter(data);
    expect(result.meta.author).toBe("JohnDoe");
    expect(result.meta.category).toBe("Tech");
  });

  it("should preserve valid types", () => {
    const data = {
      string: "text",
      number: 42,
      boolean: true,
      null: null,
    };

    const result = sanitizeFrontmatter(data);
    expect(result).toEqual(data);
  });
});
