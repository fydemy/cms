// Content management
export {
  getMarkdownContent,
  saveMarkdownContent,
  deleteMarkdownContent,
  listMarkdownFiles,
  markdownFileExists,
  parseMarkdown,
  stringifyMarkdown,
} from "./content/markdown";

export type { MarkdownData } from "./content/markdown";

export { listDirectory } from "./content/directory";

export {
  getCollectionItems,
  getCollectionItem,
  getCollections,
} from "./content/collection";

export type { CollectionItem } from "./content/collection";

export { uploadFile } from "./content/upload";

export {
  LocalStorage,
  GitHubStorage,
  getStorageProvider,
} from "./content/storage";

export type { StorageProvider, FileEntry } from "./content/storage";

// Authentication
export {
  createSession,
  verifySession,
  getSessionFromCookies,
  setSessionCookie,
  clearSessionCookie,
} from "./auth/session";

export { validateCredentials } from "./auth/login";

// API handlers
export {
  handleLogin,
  handleLogout,
  handleGetContent,
  handleSaveContent,
  handleDeleteContent,
  handleListFiles,
  createContentApiHandlers,
  createListApiHandlers,
} from "./api/handlers";

export { handleUpload } from "./api/upload";

// UI Components
export { AdminDashboard } from "./ui/AdminDashboard";
export { Login } from "./ui/Login";

// Middleware
export { createAuthMiddleware } from "./middleware/auth";

// Initialize
export { initCMS } from "./init/setup";
export type { InitCMSConfig } from "./init/setup";

// Utilities (for advanced usage)
export {
  validateFilePath,
  validateUsername,
  validatePassword,
  validateFileSize,
  sanitizeFrontmatter,
  MAX_USERNAME_LENGTH,
  MAX_PASSWORD_LENGTH,
  MAX_FILE_SIZE,
} from "./utils/validation";

export {
  checkRateLimit,
  incrementRateLimit,
  resetRateLimit,
} from "./utils/rate-limit";
