import fs from "fs/promises";
import path from "path";

export interface InitCMSConfig {
  /** Directory where content is stored (default: "public/content") */
  contentDir?: string;
}

/**
 * Initialize CMS in a Next.js project
 * Creates the content directory and an example markdown file.
 * @param config - Configuration options
 */
export async function initCMS(config: InitCMSConfig = {}) {
  const contentDir = config.contentDir || "public/content";
  const fullPath = path.join(process.cwd(), contentDir);
  const appDir = path.join(process.cwd(), "app");

  // Check if we are in a Next.js App Router project
  try {
    await fs.access(appDir);
  } catch {
    console.error(
      '❌ Error: "app" directory not found. This init script requires Next.js App Router.'
    );
    return;
  }

  console.log("🚀 Initializing @fydemy/cms...");

  // 1. Create content directory and example file
  await fs.mkdir(fullPath, { recursive: true });

  const exampleContent = `---
title: Example Post
description: This is an example markdown file
date: ${new Date().toISOString()}
---

# Welcome to your CMS!

This is an example markdown file. You can edit or delete it from the admin dashboard.

## Features

- File-based content storage
- Markdown with frontmatter
- GitHub integration for production
- Simple authentication
- No database required
`;

  const examplePath = path.join(fullPath, "example.md");
  await fs.writeFile(examplePath, exampleContent, "utf-8");
  console.log("✅ Created content directory and example file");

  // 2. Scaffold Admin Pages
  const adminDir = path.join(appDir, "admin");
  const loginDir = path.join(adminDir, "login");

  await fs.mkdir(loginDir, { recursive: true });

  await fs.writeFile(
    path.join(adminDir, "page.tsx"),
    `import { AdminDashboard } from '@fydemy/cms';\n\nexport default AdminDashboard;\n`,
    "utf-8"
  );

  await fs.writeFile(
    path.join(loginDir, "page.tsx"),
    `import { Login } from '@fydemy/cms';\n\nexport default Login;\n`,
    "utf-8"
  );
  console.log("✅ Created Admin UI pages");

  // 3. Scaffold API Routes
  const apiCmsDir = path.join(appDir, "api", "cms");

  // Login
  await fs.mkdir(path.join(apiCmsDir, "login"), { recursive: true });
  await fs.writeFile(
    path.join(apiCmsDir, "login", "route.ts"),
    `import { handleLogin } from '@fydemy/cms';\nexport { handleLogin as POST };\n`,
    "utf-8"
  );

  // Logout
  await fs.mkdir(path.join(apiCmsDir, "logout"), { recursive: true });
  await fs.writeFile(
    path.join(apiCmsDir, "logout", "route.ts"),
    `import { handleLogout } from '@fydemy/cms';\nexport { handleLogout as POST };\n`,
    "utf-8"
  );

  // Upload
  await fs.mkdir(path.join(apiCmsDir, "upload"), { recursive: true });
  await fs.writeFile(
    path.join(apiCmsDir, "upload", "route.ts"),
    `import { handleUpload } from '@fydemy/cms';\nexport { handleUpload as POST };\n`,
    "utf-8"
  );

  // List
  await fs.mkdir(path.join(apiCmsDir, "list", "[[...path]]"), {
    recursive: true,
  });
  await fs.writeFile(
    path.join(apiCmsDir, "list", "[[...path]]", "route.ts"),
    `import { createListApiHandlers } from '@fydemy/cms';\n\nconst handlers = createListApiHandlers();\nexport const GET = handlers.GET;\n`,
    "utf-8"
  );

  // Content
  await fs.mkdir(path.join(apiCmsDir, "content", "[...path]"), {
    recursive: true,
  });
  await fs.writeFile(
    path.join(apiCmsDir, "content", "[...path]", "route.ts"),
    `import { createContentApiHandlers } from '@fydemy/cms';\n\nconst handlers = createContentApiHandlers();\nexport const GET = handlers.GET;\nexport const POST = handlers.POST;\nexport const DELETE = handlers.DELETE;\n`,
    "utf-8"
  );
  console.log("✅ Created API routes");

  // 4. Middleware
  const middlewarePath = path.join(process.cwd(), "middleware.ts");
  try {
    await fs.access(middlewarePath);
    console.log(
      "⚠️  middleware.ts already exists. Please manually add the CMS auth middleware:"
    );
    console.log(`
import { createAuthMiddleware } from '@fydemy/cms';
// ... existing imports

export function middleware(request: NextRequest) {
  // Add this:
  const authResponse = createAuthMiddleware()(request);
  if (authResponse) return authResponse;
  
  // ... existing middleware logic
}
`);
  } catch {
    await fs.writeFile(
      middlewarePath,
      `import { createAuthMiddleware } from '@fydemy/cms';\nimport { NextRequest } from 'next/server';\n\nexport function middleware(request: NextRequest) {\n  return createAuthMiddleware()(request);\n}\n\nexport const config = {\n  matcher: ['/admin/:path*'],\n};\n`,
      "utf-8"
    );
    console.log("✅ Created middleware.ts");
  }

  // 5. Env example
  const envExamplePath = path.join(process.cwd(), ".env.local.example");
  await fs.writeFile(
    envExamplePath,
    `CMS_ADMIN_USERNAME=admin\nCMS_ADMIN_PASSWORD=password\nCMS_SESSION_SECRET=ensure_this_is_at_least_32_chars_long_random_string\n\n# GitHub Storage (Production)\nGITHUB_TOKEN=\nGITHUB_REPO=owner/repo\nGITHUB_BRANCH=main\n`,
    "utf-8"
  );

  console.log("");
  console.log("🎉 CMS initialized successfully!");
  console.log(
    "1. Copy .env.local.example to .env.local and set your credentials"
  );
  console.log("2. Run your dev server and visit /admin");
}
