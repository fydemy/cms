import crypto from "crypto";
import { validateUsername, validatePassword } from "../utils/validation";

/**
 * Validate username and password against environment variables using timing-safe comparison
 * @param username - Username to validate
 * @param password - Password to validate
 * @returns True if credentials are valid, false otherwise
 * @throws Error if environment variables are not configured
 */
export function validateCredentials(
  username: string,
  password: string
): boolean {
  // Validate input format first
  try {
    validateUsername(username);
    validatePassword(password);
  } catch (error) {
    // Return false for invalid input format (don't leak validation details)
    return false;
  }

  const envUsername = process.env.CMS_ADMIN_USERNAME;
  const envPassword = process.env.CMS_ADMIN_PASSWORD;

  if (!envUsername || !envPassword) {
    throw new Error(
      "CMS_ADMIN_USERNAME and CMS_ADMIN_PASSWORD must be set in environment variables"
    );
  }

  // Use timing-safe comparison to prevent timing attacks
  // Both comparisons must be done to prevent timing analysis
  const usernameMatch = timingSafeEqual(username, envUsername);
  const passwordMatch = timingSafeEqual(password, envPassword);

  return usernameMatch && passwordMatch;
}

/**
 * Timing-safe string comparison using crypto.timingSafeEqual
 * @param a - First string
 * @param b - Second string
 * @returns True if strings match
 */
function timingSafeEqual(a: string, b: string): boolean {
  try {
    // Convert to buffers with consistent encoding
    const bufferA = Buffer.from(a, "utf-8");
    const bufferB = Buffer.from(b, "utf-8");

    // If lengths differ, compare dummy buffers of same length
    // This prevents length-based timing attacks
    if (bufferA.length !== bufferB.length) {
      const dummyBuffer = Buffer.alloc(bufferA.length);
      crypto.timingSafeEqual(bufferA, dummyBuffer);
      return false;
    }

    return crypto.timingSafeEqual(bufferA, bufferB);
  } catch {
    return false;
  }
}
