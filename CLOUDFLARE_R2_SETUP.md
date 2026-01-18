# Cloudflare R2 Storage Integration

## Summary

The CMS has been updated to strictly support **Cloudflare R2** storage (removing references to S3 and Vercel Blob). The environment variables have been updated to match your requested format.

## Environment Variables

When setting up Cloudflare R2 storage, use these environment variables:

```env
# Cloudflare R2 Storage
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_ACCESS_KEY_ID=your-access-key-id
CLOUDFLARE_SECRET_ACCESS_KEY=your-secret-access-key
NEXT_PUBLIC_R2_PUBLIC_URL=https://your-public-url.r2.dev
R2_BUCKET_NAME=my-bucket
```

## How to Get These Values

### 1. CLOUDFLARE_ACCOUNT_ID

- Log in to your Cloudflare dashboard
- Your Account ID is visible in the URL or in the right sidebar

### 2. CLOUDFLARE_ACCESS_KEY_ID & CLOUDFLARE_SECRET_ACCESS_KEY

- Go to R2 in your Cloudflare dashboard
- Click "Manage R2 API Tokens"
- Create a new API token with read/write permissions
- Save both the Access Key ID and Secret Access Key

### 3. NEXT_PUBLIC_R2_PUBLIC_URL

- In your R2 bucket settings, go to "Settings"
- Under "Public Access", enable public access if needed
- Copy the public bucket URL (e.g., `https://pub-xxxxx.r2.dev`)
- Or set up a custom domain for your R2 bucket

### 4. R2_BUCKET_NAME

- The name of your R2 bucket (e.g., `my-cms-content`)

## Changes Made

### 1. `/packages/core/src/init/setup.ts`

- Updated storage provider selection to only show "GitHub" or "Cloudflare R2"
- Changed environment variable names from generic `STORAGE_*` to Cloudflare-specific names
- Removed references to S3 and Vercel Blob

### 2. `/packages/core/src/content/storage.ts`

- Added `CloudflareR2Storage` class that implements the `StorageProvider` interface
- Uses AWS S3 SDK (already installed) to communicate with Cloudflare R2
- Implements all required methods:
  - `readFile()` - Read markdown files from R2
  - `writeFile()` - Write markdown files to R2
  - `deleteFile()` - Delete files from R2
  - `listFiles()` - List files and directories in R2
  - `exists()` - Check if a file exists
  - `uploadFile()` - Upload binary files (images, PDFs, etc.)
- Updated `getStorageProvider()` to detect and use Cloudflare R2 when credentials are present

## Storage Provider Priority

The system will automatically select the storage provider in this order:

1. **Cloudflare R2** - If `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_ACCESS_KEY_ID`, and `CLOUDFLARE_SECRET_ACCESS_KEY` are set
2. **GitHub** - If `NODE_ENV=production` and `GITHUB_TOKEN` is set
3. **Local Storage** - Default for development

## File Structure in R2

- Content files: `content/your-file.md`
- Uploaded files: `uploads/filename.ext`

## Public URL Format

Uploaded files will be accessible at:

```
{NEXT_PUBLIC_R2_PUBLIC_URL}/uploads/filename.ext
```

## Notes

- The AWS S3 SDK (`@aws-sdk/client-s3`) is already installed as a dependency
- Cloudflare R2 is S3-compatible, so we use the S3 client with R2 endpoints
- The implementation automatically sets the region to "auto" for R2
- Content-Type headers are automatically set for uploaded files
