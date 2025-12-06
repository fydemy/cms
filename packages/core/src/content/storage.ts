import fs from "fs/promises";
import path from "path";
import { Octokit } from "@octokit/rest";

/**
 * Represents a file or directory entry
 */
export interface FileEntry {
  /** Relative path from base content directory */
  path: string;
  /** File or directory name */
  name: string;
  /** Type of entry */
  type: "file" | "directory";
}

/**
 * Interface for file storage operations
 */
export interface StorageProvider {
  /** Read file content as string */
  readFile(filePath: string): Promise<string>;
  /** Write content to file, creating parent directories if needed */
  writeFile(filePath: string, content: string): Promise<void>;
  /** Delete a file */
  deleteFile(filePath: string): Promise<void>;
  /** List files in a directory */
  listFiles(directory: string): Promise<FileEntry[]>;
  /** Check if a file exists */
  exists(filePath: string): Promise<boolean>;
  /** Upload a binary file */
  uploadFile(filePath: string, buffer: Buffer): Promise<string>; // Returns public URL
}

/**
 * Local file system storage (for development)
 */
export class LocalStorage implements StorageProvider {
  private baseDir: string;

  constructor(baseDir: string = "public/content") {
    this.baseDir = baseDir;
  }

  private getFullPath(filePath: string): string {
    return path.join(process.cwd(), this.baseDir, filePath);
  }

  async readFile(filePath: string): Promise<string> {
    const fullPath = this.getFullPath(filePath);
    return fs.readFile(fullPath, "utf-8");
  }

  async writeFile(filePath: string, content: string): Promise<void> {
    const fullPath = this.getFullPath(filePath);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, content, "utf-8");
  }

  async deleteFile(filePath: string): Promise<void> {
    const fullPath = this.getFullPath(filePath);
    await fs.unlink(fullPath);
  }

  async listFiles(directory: string): Promise<FileEntry[]> {
    const fullPath = this.getFullPath(directory);
    try {
      const entries = await fs.readdir(fullPath, { withFileTypes: true });
      return entries
        .map((entry) => ({
          path: path.join(directory, entry.name),
          name: entry.name,
          type: entry.isDirectory()
            ? ("directory" as const)
            : ("file" as const),
        }))
        .filter(
          (entry) => entry.type === "directory" || entry.name.endsWith(".md")
        );
    } catch (error) {
      return [];
    }
  }

  async exists(filePath: string): Promise<boolean> {
    try {
      const fullPath = this.getFullPath(filePath);
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  async uploadFile(filePath: string, buffer: Buffer): Promise<string> {
    // Store uploads in /public/uploads directory
    const uploadPath = path.join(process.cwd(), "public", "uploads", filePath);
    await fs.mkdir(path.dirname(uploadPath), { recursive: true });
    await fs.writeFile(uploadPath, buffer);

    // Return public URL path
    return `/uploads/${filePath}`;
  }
}

/**
 * GitHub storage (for production)
 */
export class GitHubStorage implements StorageProvider {
  private octokit: Octokit;
  private owner: string;
  private repo: string;
  private branch: string;
  private baseDir: string;

  constructor() {
    const token = process.env.GITHUB_TOKEN;
    const repoInfo = process.env.GITHUB_REPO;

    if (!token || !repoInfo) {
      throw new Error(
        "GITHUB_TOKEN and GITHUB_REPO must be set for production"
      );
    }

    const [owner, repo] = repoInfo.split("/");
    if (!owner || !repo) {
      throw new Error('GITHUB_REPO must be in format "owner/repo"');
    }

    this.octokit = new Octokit({ auth: token });
    this.owner = owner;
    this.repo = repo;
    this.branch = process.env.GITHUB_BRANCH || "main";
    this.baseDir = "public/content";
  }

  private getGitHubPath(filePath: string): string {
    return `${this.baseDir}/${filePath}`;
  }

  async readFile(filePath: string): Promise<string> {
    const { data } = await this.octokit.repos.getContent({
      owner: this.owner,
      repo: this.repo,
      path: this.getGitHubPath(filePath),
      ref: this.branch,
    });

    if ("content" in data) {
      return Buffer.from(data.content, "base64").toString("utf-8");
    }
    throw new Error("File not found");
  }

  async writeFile(filePath: string, content: string): Promise<void> {
    const githubPath = this.getGitHubPath(filePath);
    let sha: string | undefined;

    // Try to get existing file SHA
    try {
      const { data } = await this.octokit.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path: githubPath,
        ref: this.branch,
      });
      if ("sha" in data) {
        sha = data.sha;
      }
    } catch (error) {
      // File doesn't exist, that's ok
    }

    await this.octokit.repos.createOrUpdateFileContents({
      owner: this.owner,
      repo: this.repo,
      path: githubPath,
      message: `Update ${filePath}`,
      content: Buffer.from(content).toString("base64"),
      branch: this.branch,
      sha,
    });
  }

  async deleteFile(filePath: string): Promise<void> {
    const githubPath = this.getGitHubPath(filePath);

    // Get file SHA
    const { data } = await this.octokit.repos.getContent({
      owner: this.owner,
      repo: this.repo,
      path: githubPath,
      ref: this.branch,
    });

    if ("sha" in data) {
      await this.octokit.repos.deleteFile({
        owner: this.owner,
        repo: this.repo,
        path: githubPath,
        message: `Delete ${filePath}`,
        sha: data.sha,
        branch: this.branch,
      });
    }
  }

  async listFiles(directory: string): Promise<FileEntry[]> {
    const githubPath = this.getGitHubPath(directory);

    try {
      const { data } = await this.octokit.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path: githubPath,
        ref: this.branch,
      });

      if (Array.isArray(data)) {
        return data
          .map((item) => ({
            path: path.join(directory, item.name),
            name: item.name,
            type:
              item.type === "dir" ? ("directory" as const) : ("file" as const),
          }))
          .filter(
            (entry) => entry.type === "directory" || entry.name.endsWith(".md")
          );
      }
    } catch (error) {
      // Directory doesn't exist
    }

    return [];
  }

  async exists(filePath: string): Promise<boolean> {
    try {
      await this.octokit.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path: this.getGitHubPath(filePath),
        ref: this.branch,
      });
      return true;
    } catch {
      return false;
    }
  }

  async uploadFile(filePath: string, buffer: Buffer): Promise<string> {
    // Store uploads in public/uploads directory in GitHub
    const uploadPath = `public/uploads/${filePath}`;

    await this.octokit.repos.createOrUpdateFileContents({
      owner: this.owner,
      repo: this.repo,
      path: uploadPath,
      message: `Upload file: ${filePath}`,
      content: buffer.toString("base64"),
      branch: this.branch,
    });

    // Return public URL path
    return `/uploads/${filePath}`;
  }
}

/**
 * Get the appropriate storage provider based on environment
 */
export function getStorageProvider(): StorageProvider {
  if (process.env.NODE_ENV === "production" && process.env.GITHUB_TOKEN) {
    return new GitHubStorage();
  }
  return new LocalStorage();
}
