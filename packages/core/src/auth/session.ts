import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const SESSION_COOKIE_NAME = "cms-session";
const SESSION_DURATION = 60 * 60 * 24 * 7; // 7 days in seconds

/**
 * Session payload structure for JWT
 */
interface SessionPayload {
  /** Username of the authenticated user */
  username: string;
  /** Expiration timestamp (Unix time) */
  exp: number;
}

/**
 * Get the secret key for JWT signing
 */
function getSecretKey(): Uint8Array {
  const secret = process.env.CMS_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("CMS_SESSION_SECRET must be at least 32 characters");
  }
  return new TextEncoder().encode(secret);
}

/**
 * Create a new session token for the given username
 * @param username - The username to create a session for
 * @returns Signed JWT string
 */
export async function createSession(username: string): Promise<string> {
  const payload: SessionPayload = {
    username,
    exp: Math.floor(Date.now() / 1000) + SESSION_DURATION,
  };

  const token = await new SignJWT(payload as any)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(getSecretKey());

  return token;
}

/**
 * Verify and decode a session token
 * @param token - The JWT token to verify
 * @returns Decoded payload if valid, null otherwise
 */
export async function verifySession(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());

    // Validate payload structure
    if (
      typeof payload.username === "string" &&
      typeof payload.exp === "number"
    ) {
      return payload as unknown as SessionPayload;
    }

    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Get session from Next.js request cookies
 */
export async function getSessionFromCookies(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  return verifySession(token);
}

/**
 * Set session cookie
 */
export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DURATION,
    path: "/",
  });
}

/**
 * Clear session cookie
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
