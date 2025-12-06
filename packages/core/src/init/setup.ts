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

  // Create content directory
  await fs.mkdir(fullPath, { recursive: true });

  // Create example markdown file
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

  console.log("✅ CMS initialized successfully!");
  console.log(`📁 Content directory: ${contentDir}`);
  console.log(`📝 Example file created: ${contentDir}/example.md`);
  console.log("");
  console.log("Next steps:");
  console.log("1. Set up environment variables in .env.local:");
  console.log("   - CMS_ADMIN_USERNAME");
  console.log("   - CMS_ADMIN_PASSWORD");
  console.log("   - CMS_SESSION_SECRET (min 32 characters)");
  console.log("2. For production: GITHUB_TOKEN, GITHUB_REPO, GITHUB_BRANCH");
  console.log("3. Import and use the CMS utilities in your Next.js app");
}
