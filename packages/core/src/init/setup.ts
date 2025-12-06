import fs from "fs/promises";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

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

  // 0. Install Dependencies
  console.log("📦 Checking dependencies...");
  try {
    const packageJsonPath = path.join(process.cwd(), "package.json");
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, "utf-8"));
    const dependencies = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };

    const missingDeps = [];
    if (!dependencies["@fydemy/cms"]) missingDeps.push("@fydemy/cms");
    if (!dependencies["tailwindcss"]) missingDeps.push("tailwindcss");

    // shadcn dependencies
    if (!dependencies["class-variance-authority"])
      missingDeps.push("class-variance-authority");
    if (!dependencies["clsx"]) missingDeps.push("clsx");
    if (!dependencies["tailwind-merge"]) missingDeps.push("tailwind-merge");
    if (!dependencies["@radix-ui/react-slot"])
      missingDeps.push("@radix-ui/react-slot");
    if (!dependencies["@radix-ui/react-label"])
      missingDeps.push("@radix-ui/react-label");

    if (missingDeps.length > 0) {
      console.log(
        `🔧 Installing missing dependencies: ${missingDeps.join(", ")}...`
      );
      // Detect package manager (default to npm if locking file not found)
      let installCmd = "npm install";
      try {
        await fs.access("pnpm-lock.yaml");
        installCmd = "pnpm add";
      } catch {
        try {
          await fs.access("yarn.lock");
          installCmd = "yarn add";
        } catch {
          // npm
        }
      }

      await execAsync(`${installCmd} ${missingDeps.join(" ")}`);
      console.log("✅ Dependencies installed");
    }
  } catch (error) {
    console.warn(
      "⚠️ Could not check/install dependencies automatically. Please ensure all dependencies are installed."
    );
  }

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

  // 2. Scaffold Admin Pages (Ejected Code)
  const adminDir = path.join(appDir, "admin");
  const loginDir = path.join(adminDir, "login");

  await fs.mkdir(loginDir, { recursive: true });

  // Read template files from the dist directory (publicDir copied them there)
  const loginTemplate = await fs.readFile(
    path.join(__dirname, "login.template.tsx"),
    "utf-8"
  );
  const adminTemplate = await fs.readFile(
    path.join(__dirname, "admin.template.tsx"),
    "utf-8"
  );

  await fs.writeFile(path.join(adminDir, "page.tsx"), adminTemplate, "utf-8");

  await fs.writeFile(path.join(loginDir, "page.tsx"), loginTemplate, "utf-8");
  console.log("✅ Scaffolded Admin UI (shadcn/ui components)");

  // 2.5. Scaffold shadcn/ui Components and Utilities
  const componentsDir = path.join(process.cwd(), "components", "ui");
  const libDir = path.join(process.cwd(), "lib");

  await fs.mkdir(componentsDir, { recursive: true });
  await fs.mkdir(libDir, { recursive: true });

  // Copy utils.ts
  const utilsTemplate = await fs.readFile(
    path.join(__dirname, "lib", "utils.ts"),
    "utf-8"
  );
  await fs.writeFile(path.join(libDir, "utils.ts"), utilsTemplate, "utf-8");

  // Copy shadcn components
  const componentFiles = [
    "button.tsx",
    "input.tsx",
    "card.tsx",
    "label.tsx",
    "textarea.tsx",
    "badge.tsx",
  ];

  for (const componentFile of componentFiles) {
    const componentTemplate = await fs.readFile(
      path.join(__dirname, "components", "ui", componentFile),
      "utf-8"
    );
    await fs.writeFile(
      path.join(componentsDir, componentFile),
      componentTemplate,
      "utf-8"
    );
  }

  // Copy components.json
  const componentsJsonTemplate = await fs.readFile(
    path.join(__dirname, "components.json"),
    "utf-8"
  );
  await fs.writeFile(
    path.join(process.cwd(), "components.json"),
    componentsJsonTemplate,
    "utf-8"
  );

  console.log("✅ Scaffolded shadcn/ui components");

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
    `import { createListApiHandlers } from '@fydemy/cms';
import { NextRequest } from 'next/server';

const handlers = createListApiHandlers();

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path?: string[] }> }
) {
  const params = await context.params;
  return handlers.GET(request, { params });
}
`,
    "utf-8"
  );

  // Content
  await fs.mkdir(path.join(apiCmsDir, "content", "[...path]"), {
    recursive: true,
  });
  await fs.writeFile(
    path.join(apiCmsDir, "content", "[...path]", "route.ts"),
    `import { createContentApiHandlers } from '@fydemy/cms';
import { NextRequest } from 'next/server';

const handlers = createContentApiHandlers();

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const params = await context.params;
  return handlers.GET(request, { params });
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const params = await context.params;
  return handlers.POST(request, { params });
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const params = await context.params;
  return handlers.DELETE(request, { params });
}
`,
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
      `import { createAuthMiddleware } from '@fydemy/cms';\nimport { NextRequest } from 'next/server';\n\nexport function middleware(request: NextRequest) {\n  return createAuthMiddleware()(request);\n}\n\nexport const config = {\n  matcher: ['/admin/:path*'],\n  runtime: 'nodejs',\n};\n`,
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
