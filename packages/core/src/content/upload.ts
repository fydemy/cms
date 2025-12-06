import { getStorageProvider } from "./storage";

/**
 * Upload a file and return its public URL
 * @param fileName - Original filename
 * @param buffer - File content buffer
 * @returns Public URL path to the uploaded file
 */
export async function uploadFile(
  fileName: string,
  buffer: Buffer
): Promise<string> {
  const storage = getStorageProvider();

  // Generate unique filename with timestamp to avoid conflicts
  const timestamp = Date.now();
  const ext = fileName.split(".").pop();
  const nameWithoutExt = fileName.replace(`.${ext}`, "");
  const uniqueFileName = `${nameWithoutExt}-${timestamp}.${ext}`;

  return storage.uploadFile(uniqueFileName, buffer);
}
