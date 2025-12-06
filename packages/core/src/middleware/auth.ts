import { NextRequest, NextResponse } from "next/server";
import { getSessionFromCookies } from "../auth/session";

/**
 * Create middleware to protect admin routes
 */
export function createAuthMiddleware(
  options: {
    loginPath?: string;
    protectedPaths?: string[];
  } = {}
) {
  const loginPath = options.loginPath || "/admin/login";
  const protectedPaths = options.protectedPaths || ["/admin"];

  return async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Skip if not a protected path
    const isProtected = protectedPaths.some((path) =>
      pathname.startsWith(path)
    );
    if (!isProtected) {
      return NextResponse.next();
    }

    // Allow login page
    if (pathname === loginPath) {
      return NextResponse.next();
    }

    // Check session
    const session = await getSessionFromCookies();
    if (!session) {
      const url = request.nextUrl.clone();
      url.pathname = loginPath;
      url.searchParams.set("from", pathname);
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  };
}
