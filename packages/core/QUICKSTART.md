# @fydemy/cms - Quick Start

## What You Have

A complete, minimal CMS package for Next.js:

```
📦 @fydemy/cms (packages/core)
   - File-based markdown storage
   - GitHub integration for production
   - Simple auth (env username/password)
   - TypeScript support

🚀 Demo App (apps/dev)
   - Example Next.js application
   - Admin dashboard at /admin
   - Login page, editor, file manager
```

## Run the Demo

1. **Copy environment file:**

   ```bash
   cd apps/dev
   cp .env.local.example .env.local
   ```

2. **Edit `.env.local`** with your credentials:

   ```env
   CMS_ADMIN_USERNAME=admin
   CMS_ADMIN_PASSWORD=your_password
   CMS_SESSION_SECRET=your-32-char-secret
   ```

3. **Start development server:**

   ```bash
   cd ../..
   pnpm dev
   ```

4. **Open browser:**
   - Home: http://localhost:3000
   - Admin: http://localhost:3000/admin
   - Login with your credentials

## Use in Your Own Project

See [README.md](./README.md) for installation and setup instructions.

## Features

- ✅ Create, edit, delete markdown files
- ✅ Frontmatter support (JSON)
- ✅ Session-based authentication
- ✅ Local storage (dev) + GitHub (production)
- ✅ TypeScript types included
- ✅ Vercel-compatible

## API Example

```typescript
import { getMarkdownContent } from "@fydemy/cms";

// Read content
const post = await getMarkdownContent("example.md");
console.log(post.data.title); // "Example Post"
console.log(post.content); // markdown content
```

## Next Steps

1. Test the admin dashboard locally
2. Deploy to Vercel with GitHub token
3. Use the utilities in your pages
4. Customize the admin UI as needed

Built with TypeScript, minimal dependencies, zero database! 🎉
