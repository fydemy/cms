import { getStorageProvider, FileEntry } from "./storage";

/**
 * List all files and directories in a directory
 * @param directory - Relative path to the directory (default: root)
 * @returns Array of file entries (files and directories)
 */
export async function listDirectory(
  directory: string = ""
): Promise<FileEntry[]> {
  const storage = getStorageProvider();
  return storage.listFiles(directory);
}
