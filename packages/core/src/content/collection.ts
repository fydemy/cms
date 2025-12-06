import { getStorageProvider } from "./storage";
import { parseMarkdown } from "./markdown";

/**
 * Base interface for collection items with flexible frontmatter
 */
export interface CollectionItem<T = Record<string, any>> {
  /** The markdown content body */
  content: string;
  /** Frontmatter data with dynamic fields */
  data: T;
  /** File slug (filename without extension) */
  slug: string;
}

/**
 * Fetch all markdown files from a specific folder/collection
 * @param folderName - The folder name under public/content (e.g., "blog", "pages")
 * @returns Array of collection items with parsed frontmatter and content
 *
 * @example
 * ```ts
 * // Fetch all blog posts
 * const posts = await getCollectionItems("blog");
 * posts.forEach(post => {
 *   console.log(post.data.title); // Access any frontmatter field
 *   console.log(post.slug);       // Filename without .md
 * });
 *
 * // With type inference for known fields
 * interface BlogPost {
 *   title: string;
 *   date: string;
 *   author?: string;
 *   [key: string]: any; // Allow any other fields
 * }
 * const typedPosts = await getCollectionItems<BlogPost>("blog");
 * ```
 */
export async function getCollectionItems<T = Record<string, any>>(
  folderName: string
): Promise<CollectionItem<T>[]> {
  const storage = getStorageProvider();

  // List all files in the collection folder
  const entries = await storage.listFiles(folderName);

  // Filter for markdown files only
  const mdFiles = entries.filter(
    (entry) => entry.type === "file" && entry.path.endsWith(".md")
  );

  // Read and parse each markdown file
  const items = await Promise.all(
    mdFiles.map(async (file) => {
      const rawContent = await storage.readFile(file.path);
      const { data, content } = parseMarkdown(rawContent);

      // Extract slug from filename (remove .md extension)
      const slug = file.path.split("/").pop()!.replace(/\.md$/, "");

      return {
        content,
        data: data as T,
        slug,
      };
    })
  );

  return items;
}

/**
 * Fetch a single item from a collection by slug
 * @param folderName - The folder name under public/content
 * @param slug - The filename without .md extension
 * @returns Single collection item or null if not found
 *
 * @example
 * ```ts
 * // Fetch a specific blog post
 * const post = await getCollectionItem("blog", "my-first-post");
 * if (post) {
 *   console.log(post.data.title);
 * }
 * ```
 */
export async function getCollectionItem<T = Record<string, any>>(
  folderName: string,
  slug: string
): Promise<CollectionItem<T> | null> {
  const storage = getStorageProvider();
  const filePath = `${folderName}/${slug}.md`;

  try {
    const exists = await storage.exists(filePath);
    if (!exists) {
      return null;
    }

    const rawContent = await storage.readFile(filePath);
    const { data, content } = parseMarkdown(rawContent);

    return {
      content,
      data: data as T,
      slug,
    };
  } catch (error) {
    return null;
  }
}

/**
 * Get all unique folder names (collections) in the content directory
 * @param baseDir - Base directory to scan (default: "")
 * @returns Array of folder names
 *
 * @example
 * ```ts
 * const collections = await getCollections();
 * // Returns: ["blog", "pages", "docs", ...]
 * ```
 */
export async function getCollections(baseDir: string = ""): Promise<string[]> {
  const storage = getStorageProvider();
  const entries = await storage.listFiles(baseDir);

  return entries
    .filter((entry) => entry.type === "directory")
    .map((entry) => entry.path.split("/").pop()!)
    .filter(Boolean);
}
