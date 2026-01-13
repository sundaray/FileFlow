import type { JobStatus, JobSummary } from "../types/job.types.js";

// ─────────────────────────────────────────────────────────────
// GET JOBS
// ─────────────────────────────────────────────────────────────

export interface GetJobsSuccess {
  readonly status: "ok";
  readonly jobs: ReadonlyArray<JobSummary>;
}

// ─────────────────────────────────────────────────────────────
// DELETE JOB
// ─────────────────────────────────────────────────────────────

export interface DeleteJobSuccess {
  readonly status: "ok";
  readonly message: string;
}

export interface DeleteJobError {
  readonly status: "error";
  readonly code: "JOB_NOT_FOUND";
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
