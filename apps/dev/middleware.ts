import { createAuthMiddleware } from "@fydemy/cms";

export const middleware = createAuthMiddleware({
  loginPath: "/admin/login",
  protectedPaths: ["/admin"],
});

export const config = {
  matcher: ["/admin/:path*"],
};
