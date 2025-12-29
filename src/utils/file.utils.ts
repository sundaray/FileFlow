import { mkdir, statSync } from 'fs';
import { dirname } from 'path';
import { promisify } from 'util';

const mkdirAsync = promisify(mkdir);

/**
 * MIME type mapping for common file extensions
 */
const MIME_TYPES: Record<string, string> = {
  '.txt': 'text/plain',
  '.md': 'text/markdown',
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.xml': 'application/xml',
  '.pdf': 'application/pdf',
  '.zip': 'application/zip',
  '.gz': 'application/gzip',
  '.tar': 'application/x-tar',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.csv': 'text/csv',
  '.xlsx':
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.xls': 'application/vnd.ms-excel',
  '.docx':
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.doc': 'application/msword',
};

/**
 * Ensure parent directory of a file path exists, creating it if necessary
 * @param filePath - Full file path including filename
 * @returns Promise that resolves when directory is created or already exists
 */
export async function ensureDirectoryExists(filePath: string): Promise<void> {
  const dir = dirname(filePath);
  try {
    await mkdirAsync(dir, { recursive: true });
  } catch (error) {
    // Directory may already exist, which is fine
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code !== 'EEXIST'
    ) {
      throw error;
    }
  }
}

/**
 * Get file size in bytes
 * @param filePath - Path to the file
 * @returns File size in bytes
 * @throws Error if file doesn't exist or cannot be accessed
 */
export function getFileSize(filePath: string): number {
  try {
    const stats = statSync(filePath);
    return stats.size;
  } catch (error) {
    throw new Error(`Cannot get file size for ${filePath}: ${error}`);
  }
}

/**
 * Get MIME type based on file extension
 * @param filename - Filename with extension
 * @returns MIME type string, defaults to 'application/octet-stream' if unknown
 */
export function getContentType(filename: string): string {
  const ext = filename.toLowerCase().slice(filename.lastIndexOf('.'));
  return MIME_TYPES[ext] || 'application/octet-stream';
}
