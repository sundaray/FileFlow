/**
 * FileFlow API Client
 */

import { Effect, Data } from "effect";
import type {
  GetJobsResponse,
  GetJobResponse,
  UploadResponse,
  PipelineConfig,
  TextTransform,
} from "@/app/types";

// ─────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

// ─────────────────────────────────────────────────────────────
// Errors
// ─────────────────────────────────────────────────────────────

export class ApiError extends Data.TaggedError("ApiError")<{
  readonly code: string;
  readonly message: string;
  readonly statusCode?: number;
}> {}

export class NetworkError extends Data.TaggedError("NetworkError")<{
  readonly cause: unknown;
}> {}

// ─────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────

function buildUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}

function handleResponse<T>(response: Response): Effect.Effect<T, ApiError> {
  return Effect.gen(function* () {
    const data = yield* Effect.tryPromise({
      try: () => response.json(),
      catch: () =>
        new ApiError({
          code: "PARSE_ERROR",
          message: "Failed to parse response",
        }),
    });

    if (!response.ok || data.status === "error") {
      return yield* Effect.fail(
        new ApiError({
          code: data.code ?? "UNKNOWN_ERROR",
          message: data.message ?? "An unknown error occurred",
          statusCode: response.status,
        }),
      );
    }

    return data as T;
  });
}

// ─────────────────────────────────────────────────────────────
// Pipeline Builder
// ─────────────────────────────────────────────────────────────

export function buildPipelineConfig(
  textTransform: TextTransform,
): PipelineConfig {
  return {
    stages: [
      {
        id: "csv-parser",
        type: "csv-parser",
        enabled: true,
        options: {
          delimiter: ",",
          hasHeaders: true,
          skipEmptyLines: true,
        },
      },
      {
        id: "text-transform",
        type: textTransform,
        enabled: true,
        options: {
          fields: "*",
        },
      },
      {
        id: "json-stringify",
        type: "json-stringify",
        enabled: true,
        options: {},
      },
    ],
  };
}

// ─────────────────────────────────────────────────────────────
// API Functions
// ─────────────────────────────────────────────────────────────

/**
 * Get all jobs
 */
export function getJobs(): Effect.Effect<
  GetJobsResponse,
  ApiError | NetworkError
> {
  return Effect.gen(function* () {
    const response = yield* Effect.tryPromise({
      try: () => fetch(buildUrl("/api/jobs")),
      catch: (error) => new NetworkError({ cause: error }),
    });

    return yield* handleResponse<GetJobsResponse>(response);
  });
}

/**
 * Get a single job by ID
 */
export function getJob(
  jobId: string,
): Effect.Effect<GetJobResponse, ApiError | NetworkError> {
  return Effect.gen(function* () {
    const response = yield* Effect.tryPromise({
      try: () => fetch(buildUrl(`/api/jobs/${jobId}`)),
      catch: (error) => new NetworkError({ cause: error }),
    });

    return yield* handleResponse<GetJobResponse>(response);
  });
}

/**
 * Upload a file and start processing
 */
export function uploadFile(
  file: File,
  textTransform: TextTransform,
): Effect.Effect<UploadResponse, ApiError | NetworkError> {
  return Effect.gen(function* () {
    const pipelineConfig = buildPipelineConfig(textTransform);

    const response = yield* Effect.tryPromise({
      try: () =>
        fetch(buildUrl("/api/upload"), {
          method: "POST",
          headers: {
            "X-Filename": encodeURIComponent(file.name),
            "X-Pipeline-Config": JSON.stringify(pipelineConfig),
            "Content-Type": "application/octet-stream",
            "Content-Length": file.size.toString(),
          },
          body: file,
        }),
      catch: (error) => new NetworkError({ cause: error }),
    });

    return yield* handleResponse<UploadResponse>(response);
  });
}

/**
 * Cancel a job
 */
export function cancelJob(
  jobId: string,
): Effect.Effect<void, ApiError | NetworkError> {
  return Effect.gen(function* () {
    const response = yield* Effect.tryPromise({
      try: () =>
        fetch(buildUrl(`/api/jobs/${jobId}/cancel`), {
          method: "POST",
        }),
      catch: (error) => new NetworkError({ cause: error }),
    });

    yield* handleResponse(response);
  });
}

/**
 * Delete a job
 */
export function deleteJob(
  jobId: string,
): Effect.Effect<void, ApiError | NetworkError> {
  return Effect.gen(function* () {
    const response = yield* Effect.tryPromise({
      try: () =>
        fetch(buildUrl(`/api/jobs/${jobId}`), {
          method: "DELETE",
        }),
      catch: (error) => new NetworkError({ cause: error }),
    });

    yield* handleResponse(response);
  });
}

/**
 * Get download URL for a completed job
 */
export function getDownloadUrl(jobId: string): string {
  return buildUrl(`/api/download/${jobId}`);
}

/**
 * Get progress SSE URL for a job
 */
export function getProgressUrl(jobId: string): string {
  return buildUrl(`/api/progress/${jobId}`);
}
