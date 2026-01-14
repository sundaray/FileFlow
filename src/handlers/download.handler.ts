import { Effect, Option } from "effect";
import { FileSystem } from "@effect/platform";
import { JobStore } from "../services/job-store.service.js";
import { canDownload, type DownloadOutput } from "../rules/download.rule.js";
import { getContentType } from "../utils/file.utils.js";
import { PlatformError } from "@effect/platform/Error";

// ─────────────────────────────────────────────────────────────
// Download Handler
// ─────────────────────────────────────────────────────────────

export interface DownloadHandlerInput {
  jobId: string;
}

export interface DownloadHandlerOutput {
  output: DownloadOutput;
}

export function handleDownload(
  input: DownloadHandlerInput
): Effect.Effect<
  DownloadHandlerOutput,
  PlatformError,
  JobStore | FileSystem.FileSystem
> {
  return Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;

    // Get job from store
    const maybeJob = yield* JobStore.get(input.jobId);
    const job = Option.getOrNull(maybeJob);

    // Check if output file exists (only if job exists and has output path)
    let outputFileExists = false;
    if (job !== null && job.outputPath) {
      outputFileExists = yield* fs.exists(job.outputPath);
    }

    const output = canDownload({
      job,
      jobId: input.jobId,
      outputFileExists,
    });

    return { output };
  });
}

// ─────────────────────────────────────────────────────────────
// Get File Info Handler (for setting response headers)
// ─────────────────────────────────────────────────────────────

export interface FileInfo {
  size: number;
  fileName: string;
  contentType: string;
}

export interface GetFileInfoHandlerInput {
  filePath: string;
}

export interface GetFileInfoHandlerOutput {
  fileInfo: FileInfo;
}

export function handleGetFileinfo(
  input: GetFileInfoHandlerInput
): Effect.Effect<
  GetFileInfoHandlerOutput,
  PlatformError,
  FileSystem.FileSystem
> {
  return Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;

    const stat = yield* fs.stat(input.filePath);
    const fileName = extractFileName(input.filePath);
    const contentType = getContentType(fileName);

    return {
      fileInfo: {
        size: Number(stat.size),
        fileName,
        contentType,
      },
    };
  });
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
function extractFileName(filePath: string): string {
  const parts = filePath.split("/");
  return parts[parts.length - 1] || "doenload";
}

const MIME_TYPES: Record<string, string> = {
  ".txt": "text/plain",
  ".json": "application/json",
  ".csv": "text/csv",
  ".gz": "application/gzip",
  ".br": "application/x-brotli",
  ".deflate": "application/x-deflate",
};

function generateContentType(fileName: string): string {
  const lastDotIndex = fileName.lastIndexOf(".");
  if (lastDotIndex === -1) return "application/octet-stream";

  const extension = fileName.toLowerCase().slice(lastDotIndex);
  return MIME_TYPES[extension] ?? "application/octet-stream";
}
