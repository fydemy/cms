import { NextRequest, NextResponse } from "next/server";
import { validateCredentials } from "../auth/login";
import { createSession, getSessionFromCookies } from "../auth/session";
import {
  getMarkdownContent,
  saveMarkdownContent,
  deleteMarkdownContent,
} from "../content/markdown";
import { listDirectory } from "../content/directory";

/**
 * Login endpoint with rate limiting
 */
export async function handleLogin(request: NextRequest) {
  try {
    // Get IP address for rate limiting
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0] ||
      request.headers.get("x-real-ip") ||
      "unknown";

    // Check rate limit
    const { checkRateLimit, incrementRateLimit, resetRateLimit } = await import(
      "../utils/rate-limit"
    );
    const rateLimit = checkRateLimit(ip);

    if (rateLimit.isLimited) {
      const retryAfter = Math.ceil((rateLimit.resetTime - Date.now()) / 1000);
      return NextResponse.json(
        {
          error: "Too many login attempts. Please try again later.",
          retryAfter,
        },
        {
          status: 429,
          headers: {
            "Retry-After": retryAfter.toString(),
          },
        }
      );
    }

    const body = (await request.json()) as {
      username?: string;
      password?: string;
    };
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    // Validate credentials
    const isValid = validateCredentials(username, password);

    if (!isValid) {
      // Increment rate limit on failed attempt
      incrementRateLimit(ip);

      // Generic error message to avoid username enumeration
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Reset rate limit on successful login
    resetRateLimit(ip);

    const token = await createSession(username);
    const response = NextResponse.json({ success: true });

    // Set cookie in response
    response.cookies.set("cms-session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Authentication service temporarily unavailable" },
      { status: 500 }
    );
  }
}

/**
 * Logout endpoint
 */
export async function handleLogout() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete("cms-session");
  return response;
}

/**
 * Get content endpoint
 */
export async function handleGetContent(
  _request: NextRequest,
  filePath: string
) {
  try {
    const session = await getSessionFromCookies();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const content = await getMarkdownContent(filePath);
    return NextResponse.json(content);
  } catch (error) {
    console.error("Get content error:", error);
    return NextResponse.json(
      { error: "Failed to read content" },
      { status: 500 }
    );
  }
}

/**
 * Save content endpoint
 */
export async function handleSaveContent(
  request: NextRequest,
  filePath: string
) {
  try {
    const session = await getSessionFromCookies();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as {
      data?: Record<string, any>;
      content?: string;
    };
    const { data, content } = body;

    // Content is optional now - default to empty string
    await saveMarkdownContent(filePath, data || {}, content || "");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Save content error:", error);
    return NextResponse.json(
      { error: "Failed to save content" },
      { status: 500 }
    );
  }
}

/**
 * Delete content endpoint
 */
export async function handleDeleteContent(
  _request: NextRequest,
  filePath: string
) {
  try {
    const session = await getSessionFromCookies();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await deleteMarkdownContent(filePath);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete content error:", error);
    return NextResponse.json(
      { error: "Failed to delete content" },
      { status: 500 }
    );
  }
}

/**
 * List files endpoint
 */
export async function handleListFiles(directory: string = "") {
  try {
    const session = await getSessionFromCookies();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const entries = await listDirectory(directory);
    return NextResponse.json({ entries });
  } catch (error) {
    console.error("List files error:", error);
    return NextResponse.json(
      { error: "Failed to list files" },
      { status: 500 }
    );
  }
}

/**
 * Create API route handlers for Next.js App Router
 */
export function createContentApiHandlers() {
  return {
    async GET(
      request: NextRequest,
      { params }: { params: { path: string[] } }
    ) {
      const filePath = params.path.join("/");
      return handleGetContent(request, filePath);
    },
    async POST(
      request: NextRequest,
      { params }: { params: { path: string[] } }
    ) {
      const filePath = params.path.join("/");
      return handleSaveContent(request, filePath);
    },
    async DELETE(
      request: NextRequest,
      { params }: { params: { path: string[] } }
    ) {
      const filePath = params.path.join("/");
      return handleDeleteContent(request, filePath);
    },
  };
}

/**
 * Create list API handlers
 */
export function createListApiHandlers() {
  return {
    async GET(
      _request: NextRequest,
      { params }: { params: { path?: string[] } }
    ) {
      const directory = params?.path?.join("/") || "";
      return handleListFiles(directory);
    },
  };
}
