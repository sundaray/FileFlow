/**
 * File Utilities
 *
 * Helper functions for file operations
 */

// ─────────────────────────────────────────────────────────────
// MIME Types
// ─────────────────────────────────────────────────────────────

const MIME_TYPES: Record<string, string> = {
  // Text formats
  ".txt": "text/plain",
  ".json": "application/json",
  ".csv": "text/csv",
  ".xml": "application/xml",
  ".html": "text/html",
  ".md": "text/markdown",

  // Compression formats
  ".gz": "application/gzip",
  ".br": "application/x-brotli",
  ".deflate": "application/x-deflate",
  ".zip": "application/zip",

  // Binary formats
  ".bin": "application/octet-stream",
};

// ─────────────────────────────────────────────────────────────
// Content Type Helper
// ─────────────────────────────────────────────────────────────

/**
 * Get the MIME content type for a file based on its extension.
 * Returns "application/octet-stream" for unknown extensions.
 */
export function getContentType(fileName: string): string {
  const lastDotIndex = fileName.lastIndexOf(".");

  if (lastDotIndex === -1) {
    return "application/octet-stream";
  }

  const extension = fileName.toLowerCase().slice(lastDotIndex);
  return MIME_TYPES[extension] ?? "application/octet-stream";
}

// ─────────────────────────────────────────────────────────────
// File Name Helpers
// ─────────────────────────────────────────────────────────────

/**
 * Extract the file name from a file path.
 */
export function extractFileName(filePath: string): string {
  const parts = filePath.split("/");
  return parts[parts.length - 1] || "download";
}

/**
 * Get the file extension from a file name.
 */
export function getExtension(fileName: string): string {
  const lastDotIndex = fileName.lastIndexOf(".");

  if (lastDotIndex === -1) {
    return "";
  }

  return fileName.slice(lastDotIndex);
}
