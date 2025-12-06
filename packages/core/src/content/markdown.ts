import matter from "gray-matter";
import { getStorageProvider } from "./storage";
import {
  validateFilePath,
  sanitizeFrontmatter,
  MAX_FILE_SIZE,
} from "../utils/validation";

export interface MarkdownData {
  content: string;
  data: Record<string, any>;
}

/**
 * Parse markdown content with frontmatter
 * @param rawContent - Raw markdown content to parse
 * @returns Parsed markdown data with frontmatter and content
 */
export function parseMarkdown(rawContent: string): MarkdownData {
  const { data, content } = matter(rawContent);
  return { data, content };
}

/**
 * Convert data and content back to markdown with frontmatter
 */
export function stringifyMarkdown(
  data: Record<string, any>,
  content: string
): string {
  return matter.stringify(content, data);
}

/**
 * Read and parse a markdown file
 * @param filePath - Path to the markdown file
 * @returns Parsed markdown data
 * @throws Error if file path is invalid or file is too large
 */
export async function getMarkdownContent(
  filePath: string
): Promise<MarkdownData> {
  // Validate file path
  const validatedPath = validateFilePath(filePath);

  const storage = getStorageProvider();
  const rawContent = await storage.readFile(validatedPath);

  // Check file size
  const size = Buffer.byteLength(rawContent, "utf-8");
  if (size > MAX_FILE_SIZE) {
    throw new Error(
      `File size (${size} bytes) exceeds maximum allowed size (${MAX_FILE_SIZE} bytes)`
    );
  }

  return parseMarkdown(rawContent);
}

/**
 * Write markdown file with frontmatter
 * @param filePath - Path to the markdown file
 * @param data - Frontmatter data object
 * @param content - Markdown content
 * @throws Error if file path is invalid or content is too large
 */
export async function saveMarkdownContent(
  filePath: string,
  data: Record<string, any>,
  content: string
): Promise<void> {
  // Validate file path
  const validatedPath = validateFilePath(filePath);

  // Sanitize frontmatter
  const sanitizedData = sanitizeFrontmatter(data);

  const markdown = stringifyMarkdown(sanitizedData, content);

  // Check size before writing
  const size = Buffer.byteLength(markdown, "utf-8");
  if (size > MAX_FILE_SIZE) {
    throw new Error(
      `Content size (${size} bytes) exceeds maximum allowed size (${MAX_FILE_SIZE} bytes)`
    );
  }

  const storage = getStorageProvider();
  await storage.writeFile(validatedPath, markdown);
}

/**
 * Delete a markdown file
 * @param filePath - Path to the markdown file
 * @throws Error if file path is invalid
 */
export async function deleteMarkdownContent(filePath: string): Promise<void> {
  // Validate file path
  const validatedPath = validateFilePath(filePath);

  const storage = getStorageProvider();
  await storage.deleteFile(validatedPath);
}

/**
 * List all markdown files in a directory
 * @param directory - Directory path (optional, defaults to root)
 * @returns Array of file paths
 * @throws Error if directory path is invalid
 */
export async function listMarkdownFiles(
  directory: string = ""
): Promise<string[]> {
  // Validate directory path if provided
  const validatedDir = directory ? validateFilePath(directory) : "";

  const storage = getStorageProvider();
  const entries = await storage.listFiles(validatedDir);
  return entries
    .filter((entry) => entry.type === "file")
    .map((entry) => entry.path);
}

/**
 * Check if a markdown file exists
 * @param filePath - Path to the markdown file
 * @returns True if file exists, false otherwise
 * @throws Error if file path is invalid
 */
export async function markdownFileExists(filePath: string): Promise<boolean> {
  // Validate file path
  const validatedPath = validateFilePath(filePath);

  const storage = getStorageProvider();
  return storage.exists(validatedPath);
}
