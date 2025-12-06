import path from "path";

/**
 * Maximum username length (prevents DoS)
 */
export const MAX_USERNAME_LENGTH = 100;

/**
 * Maximum password length (prevents DoS)
 */
export const MAX_PASSWORD_LENGTH = 1000;

/**
 * Maximum file size in bytes (10MB)
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Validate and sanitize file path to prevent directory traversal
 * @param filePath - The file path to validate
 * @returns Sanitized file path
 * @throws Error if path is invalid or attempts directory traversal
 */
export function validateFilePath(filePath: string): string {
  if (!filePath || typeof filePath !== "string") {
    throw new Error("Invalid file path");
  }

  // Remove any null bytes
  if (filePath.includes("\x00")) {
    throw new Error("Invalid file path: null byte detected");
  }

  // Check for directory traversal attempts BEFORE normalization
  if (filePath.includes("..")) {
    throw new Error("Invalid file path: directory traversal detected");
  }

  // Normalize the path
  const normalized = path.normalize(filePath).replace(/^(\.\.(\/|\\|$))+/, "");

  // Check if normalized path is different and contains dangerous patterns
  if (normalized.startsWith("/") || normalized.startsWith("\\")) {
    throw new Error("Invalid file path: directory traversal detected");
  }

  // Ensure path doesn't contain dangerous patterns
  const dangerousPatterns = [
    /\.\./,
    /^[/\\]/,
    /[<>:"|?*]/,
    /\x00/,
    /^(con|prn|aux|nul|com[0-9]|lpt[0-9])(\..*)?$/i, // Windows reserved names
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(normalized)) {
      throw new Error("Invalid file path: contains dangerous characters");
    }
  }

  return normalized;
}

/**
 * Validate username input
 * @param username - The username to validate
 * @returns True if valid
 * @throws Error if invalid
 */
export function validateUsername(username: string): boolean {
  if (!username || typeof username !== "string") {
    throw new Error("Username is required");
  }

  if (username.length > MAX_USERNAME_LENGTH) {
    throw new Error(
      `Username must be ${MAX_USERNAME_LENGTH} characters or less`
    );
  }

  // Only allow alphanumeric, underscore, hyphen
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    throw new Error(
      "Username must contain only letters, numbers, underscores, and hyphens"
    );
  }

  return true;
}

/**
 * Validate password input
 * @param password - The password to validate
 * @returns True if valid
 * @throws Error if invalid
 */
export function validatePassword(password: string): boolean {
  if (!password || typeof password !== "string") {
    throw new Error("Password is required");
  }

  if (password.length > MAX_PASSWORD_LENGTH) {
    throw new Error(
      `Password must be ${MAX_PASSWORD_LENGTH} characters or less`
    );
  }

  return true;
}

/**
 * Validate file size
 * @param size - File size in bytes
 * @returns True if valid
 * @throws Error if too large
 */
export function validateFileSize(size: number): boolean {
  if (size > MAX_FILE_SIZE) {
    throw new Error(
      `File size exceeds maximum allowed size of ${
        MAX_FILE_SIZE / 1024 / 1024
      }MB`
    );
  }

  return true;
}

/**
 * Sanitize frontmatter data to prevent injection
 * @param data - The data object to sanitize
 * @returns Sanitized data
 */
export function sanitizeFrontmatter(
  data: Record<string, any>
): Record<string, any> {
  const sanitized: Record<string, any> = {};

  for (const [key, value] of Object.entries(data)) {
    // Validate key
    if (!/^[a-zA-Z0-9_-]+$/.test(key)) {
      continue; // Skip invalid keys
    }

    // Sanitize value based on type
    if (typeof value === "string") {
      // Remove null bytes
      sanitized[key] = value.replace(/\x00/g, "");
    } else if (
      typeof value === "number" ||
      typeof value === "boolean" ||
      value === null
    ) {
      sanitized[key] = value;
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map((item) =>
        typeof item === "string" ? item.replace(/\x00/g, "") : item
      );
    } else if (typeof value === "object") {
      sanitized[key] = sanitizeFrontmatter(value);
    }
  }

  return sanitized;
}
