import type { JobStatus, JobSummary } from "../types/job.types.js";

// ─────────────────────────────────────────────────────────────
// GET JOBS
// ─────────────────────────────────────────────────────────────

export interface GetJobsSuccess {
  readonly status: "ok";
  readonly jobs: ReadonlyArray<JobSummary>;
}
// ─────────────────────────────────────────────────────────────
// GET JOB
// ─────────────────────────────────────────────────────────────

export interface JobDetails {
  readonly jobId: string;
  readonly filename: string;
  readonly status: JobStatus;
  readonly currentStage: string | null;
  readonly stageIndex: number;
  readonly totalStages: number;
  readonly bytesRead: number;
  readonly bytesWritten: number;
  readonly rowsProcessed: number;
  readonly rowsFiltered: number;
  readonly startedAt?: string;
  readonly updatedAt: string;
  readonly completedAt?: string;
  readonly error: string | null;
}

export interface GetJobSuccess {
  readonly status: "ok";
  readonly job: JobDetails;
}

export interface GetJobError {
  readonly status: "error";
  readonly code: "JOB_NOT_FOUND";
  readonly message: string;
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
// CANCEL JOB
// ─────────────────────────────────────────────────────────────

export interface CancelJobSuccess {
  readonly status: "ok";
  readonly message: string;
}

export interface CancelJobError {
  readonly status: "error";
  readonly code: "JOB_NOT_FOUND" | "CANNOT_CANCEL";
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
