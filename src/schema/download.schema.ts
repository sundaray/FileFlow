import type { JobStatus } from "../types/job.types.js";

// ─────────────────────────────────────────────────────────────
// DOWNLOAD ERRORS
// ─────────────────────────────────────────────────────────────

export interface DownloadJobNotFoundError {
  readonly status: "error";
  readonly code: "JOB_NOT_FOUND";
  readonly message: string;
}

export interface DownloadJobNotCompletedError {
  readonly status: "error";
  readonly code: "JOB_NOT_COMPLETED";
  readonly message: string;
  readonly currentStatus: JobStatus;
}

export interface DownloadOutputFileNotFoundError {
  readonly status: "error";
  readonly code: "OUTPUT_FILE_NOT_FOUND";
  readonly message: string;
}

export interface DownloadStreamError {
  readonly status: "error";
  readonly code: "STREAM_ERROR";
  readonly message: string;
}

// ─────────────────────────────────────────────────────────────
// SERVER ERRORS
// ─────────────────────────────────────────────────────────────

export interface InternalServerError {
  readonly status: "error";
  readonly code: "INTERNAL_SERVER_ERROR";
  readonly message: string;
}



