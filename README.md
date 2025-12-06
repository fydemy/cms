# @fydemy/cms

[![npm version](https://badge.fury.io/js/@fydemy%2Fcms.svg)](https://www.npmjs.com/package/@fydemy/cms)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)

A minimal, secure, file-based CMS for Next.js without database requirements. Store content as markdown files with GitHub integration for production deployments.

## Features

- 📝 **File-based Storage** - Markdown files with frontmatter in `/public/content`
- 🔐 **Secure Authentication** - Timing-safe password comparison, rate limiting, input validation
- 🚀 **Vercel Compatible** - Deploy without any database setup
- 🐙 **GitHub Integration** - Automatic file commits in production
- 📦 **Zero Config** - Minimal setup required
- 🎯 **TypeScript First** - Full type safety with comprehensive type definitions
- ⚡ **Lightweight** - Small bundle size (~30KB), minimal dependencies
- 🛡️ **Security Hardened** - Built with security best practices

## Installation

```bash
npm install @fydemy/cms
# or
pnpm add @fydemy/cms
# or
yarn add @fydemy/cms
```

## Quick Start

### 1. Initialize the CMS

Create a script to initialize your content directory:

```typescript
// scripts/init-cms.ts
import { initCMS } from "@fydemy/cms";

initCMS();
```

Run it:

```bash
npx tsx scripts/init-cms.ts
```

### 2. Set Environment Variables

Create `.env.local`:

```env
# Required for authentication
CMS_ADMIN_USERNAME=admin
CMS_ADMIN_PASSWORD=your_secure_password
CMS_SESSION_SECRET=your-secret-key-must-be-at-least-32-characters-long

# Optional: For production (GitHub integration)
GITHUB_TOKEN=ghp_your_github_token
GITHUB_REPO=username/repository
GITHUB_BRANCH=main
```

> **Security Note**: Use strong passwords and keep `CMS_SESSION_SECRET` at least 32 characters long.

### 3. Set Up API Routes

Create the following API routes in your Next.js app:

**`app/api/cms/login/route.ts`**

```typescript
import { handleLogin } from "@fydemy/cms";
export { handleLogin as POST };
```

**`app/api/cms/logout/route.ts`**

```typescript
import { handleLogout } from "@fydemy/cms";
export { handleLogout as POST };
```

**`app/api/cms/content/[...path]/route.ts`**

```typescript
import { createContentApiHandlers } from "@fydemy/cms";

const handlers = createContentApiHandlers();
export const GET = handlers.GET;
export const POST = handlers.POST;
export const DELETE = handlers.DELETE;
```

**`app/api/cms/list/[[...path]]/route.ts`**

```typescript
import { createListApiHandlers } from "@fydemy/cms";

const handlers = createListApiHandlers();
export const GET = handlers.GET;
```

### 4. Add Middleware

**`middleware.ts`** (root of your project)

```typescript
import { createAuthMiddleware } from "@fydemy/cms";

export const middleware = createAuthMiddleware({
  loginPath: "/admin/login",
  protectedPaths: ["/admin"],
});

export const config = {
  matcher: ["/admin/:path*"],
};
```

### 5. Read Content in Your App

```typescript
import { getMarkdownContent } from "@fydemy/cms";

export default async function BlogPost({
  params,
}: {
  params: { slug: string };
}) {
  const post = await getMarkdownContent(`${params.slug}.md`);

  return (
    <article>
      <h1>{post.data.title}</h1>
      <p>{post.data.description}</p>
      <div>{post.content}</div>
    </article>
  );
}
```

## Security Features

### Built-in Security

- **Timing-Safe Authentication**: Uses `crypto.timingSafeEqual` to prevent timing attacks
- **Rate Limiting**: 5 login attempts per 15 minutes per IP address
- **Input Validation**: All inputs validated and sanitized
- **Path Validation**: Prevents directory traversal attacks
- **File Size Limits**: Default 10MB maximum file size
- **Secure Sessions**: httpOnly, sameSite, and secure cookies in production
- **No Username Enumeration**: Generic error messages

### Security Best Practices

1. **Strong Credentials**: Use strong, unique passwords for `CMS_ADMIN_PASSWORD`
2. **Secret Management**: Keep `CMS_SESSION_SECRET` at least 32 characters
3. **GitHub Token Security**: Use minimal permissions (only `repo` scope)
4. **HTTPS Only**: Always use HTTPS in production
5. **Regular Updates**: Keep dependencies up to date
6. **Environment Variables**: Never commit `.env` files

For more security information, see [SECURITY.md](./SECURITY.md).

## API Reference

### Content Management

```typescript
// Read markdown file
const content = await getMarkdownContent("blog/post.md");
// Returns: { data: {...}, content: "..." }

// Write markdown file
await saveMarkdownContent(
  "blog/post.md",
  { title: "My Post", date: "2024-01-01" },
  "# Hello World"
);

// Delete file
await deleteMarkdownContent("blog/post.md");

// List files
const files = await listMarkdownFiles("blog");
// Returns: ['blog/post1.md', 'blog/post2.md']

// Check if file exists
const exists = await markdownFileExists("blog/post.md");
```

### Parsing Utilities

```typescript
import { parseMarkdown, stringifyMarkdown } from "@fydemy/cms";

// Parse markdown string
const { data, content } = parseMarkdown(rawMarkdown);

// Convert to markdown
const markdown = stringifyMarkdown({ title: "Post" }, "Content here");
```

### Authentication

```typescript
import { validateCredentials, createSession } from "@fydemy/cms";

// Validate credentials
const isValid = validateCredentials("admin", "password");

// Create session (returns JWT)
const token = await createSession("admin");
```

### Validation Utilities

```typescript
import {
  validateFilePath,
  validateUsername,
  validatePassword,
  sanitizeFrontmatter,
} from "@fydemy/cms";

// Validate file path (prevents directory traversal)
const safePath = validateFilePath("blog/post.md");

// Validate username
validateUsername("admin"); // throws if invalid

// Sanitize frontmatter data
const safe = sanitizeFrontmatter({ title: "Test", script: "<script>" });
```

## Storage

### Development

Files are stored locally in `/public/content` directory.

### Production

When `NODE_ENV=production` and `GITHUB_TOKEN` is set, all file operations are performed via GitHub API, creating commits directly to your repository.

## Environment Variables

| Variable             | Required   | Description                     |
| -------------------- | ---------- | ------------------------------- |
| `CMS_ADMIN_USERNAME` | Yes        | Admin username                  |
| `CMS_ADMIN_PASSWORD` | Yes        | Admin password                  |
| `CMS_SESSION_SECRET` | Yes        | JWT secret (min 32 chars)       |
| `GITHUB_TOKEN`       | Production | GitHub personal access token    |
| `GITHUB_REPO`        | Production | Repository (format: owner/repo) |
| `GITHUB_BRANCH`      | Production | Branch name (default: main)     |

## GitHub Setup

1. Create a GitHub Personal Access Token with `repo` permissions
2. Add the token to your environment variables
3. Deploy to Vercel and configure the environment variables

## FAQ

### Is this suitable for production?

Yes! The package includes security hardening, rate limiting, and has been tested for production use. Make sure to follow security best practices.

### Can I use this with other frameworks?

This package is designed for Next.js App Router (13+). For other frameworks, you can use the core utilities but will need to implement your own API routes.

### How do I customize the file size limit?

```typescript
import { MAX_FILE_SIZE } from "@fydemy/cms";
// Default is 10MB, you can check this constant
```

To change it, you'll need to implement your own validation layer.

### Does it support images?

Yes! The package includes file upload functionality. Images can be uploaded and stored in `/public/uploads` (local) or via GitHub API (production).

### How do I backup my content?

Since content is stored in your GitHub repository (in production), it's automatically backed up with full version history. In development, the `/public/content` directory can be committed to git.

### What about rate limiting in production?

The built-in rate limiter is memory-based and resets on server restart. For production with multiple instances, consider implementing Redis-based rate limiting.

### Can I add more admin users?

Currently, the package supports a single admin user via environment variables. For multi-user support, you'd need to implement a custom authentication layer.

## Example Admin UI

Check the `/apps/dev` directory in this repository for a complete example with:

- Login page
- Admin dashboard
- File editor
- File management

## Troubleshooting

### "CMS_SESSION_SECRET must be at least 32 characters"

Make sure your session secret is long enough. Generate a secure random string:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Rate limiting not working across restarts

The rate limiter is in-memory. For persistent rate limiting, implement Redis storage.

### GitHub API rate limits

GitHub API has rate limits. For high-traffic sites, consider caching content or using a CDN.

## License

MIT

## Contributing

Contributions welcome! This is a minimal CMS focused on simplicity and maintainability.

Please report security vulnerabilities privately to security@fydemy.com or via GitHub security advisories.

## Links

- [GitHub Repository](https://github.com/fydemy/cms)
- [npm Package](https://www.npmjs.com/package/@fydemy/cms)
- [Report Issues](https://github.com/fydemy/cms/issues)
- [Security Policy](https://github.com/fydemy/cms/blob/main/SECURITY.md)
