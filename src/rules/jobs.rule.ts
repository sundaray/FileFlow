/**
 * Jobs Business Rule
 */

import { Job, JobSummary, JobStatus } from "../types/job.types.js";

// ─────────────────────────────────────────────────────────────
// Get Jobs
// ─────────────────────────────────────────────────────────────

export interface GetJobsInput {
  readonly jobs: ReadonlyArray<Job>;
  readonly filterByStatus?: JobStatus;
}

export interface GetJobsOutput {
  readonly _tag: "Success";
  readonly jobs: ReadonlyArray<JobSummary>;
}

export function getJobs(input: GetJobsInput): GetJobsOutput {
  let jobs = input.jobs;

  // Filter by status if provided
  if (input.filterByStatus !== undefined) {
    jobs = jobs.filter((job) => job.status === input.filterByStatus);
  }

  // Sort by createdAt descending (newest first)
  const sorted = [...jobs].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );

  // Map to summaries
  const summaries = sorted.map((job) => ({
    jobId: job.id,
    fileName: job.originalFileName,
    status: job.status,
    createdAt: job.createdAt,
    completedAt: job.completedAt,
    bytesRead: job.bytesRead,
    bytesWritten: job.bytesWritten,
  }));

  return { _tag: "Success", jobs: summaries };
}

// ─────────────────────────────────────────────────────────────
// Get Job
// ─────────────────────────────────────────────────────────────
export interface GetJobInut {
  readonly job: Job | null;
  readonly jobId: string;
}

export type GetJobOutput =
  | { readonly _tag: "Success"; readonly job: Job }
  | { readonly _tag: "NotFound"; readonly jobId: string };

export function getJob(input: GetJobInut): GetJobOutput {
  if (input.job === null) {
    return { _tag: "NotFound", jobId: input.jobId };
  }

  return { _tag: "Success", job: input.job };
}

// ─────────────────────────────────────────────────────────────
// Delete Job
// ─────────────────────────────────────────────────────────────
export interface DeleteJobInput {
  readonly job: Job | null;
  readonly jobId: string;
}

export type DeleteJobOutput =
  | { readonly _tag: "Success"; readonly job: Job }
  | { readonly _tag: "NotFound"; readonly jobId: string };

export function deleteJob(input: DeleteJobInput): DeleteJobOutput {
  if (input.job === null) {
    return { _tag: "NotFound", jobId: input.jobId };
  }

  return { _tag: "Success", job: input.job };
}

// ─────────────────────────────────────────────────────────────
// Cancel Job
// ─────────────────────────────────────────────────────────────
export interface CancelJobInput {
  readonly job: Job | null;
  readonly jobId: string;
}

export type CancelJobOutput =
  | { readonly _tag: "Success"; readonly job: Job }
  | { readonly _tag: "NotFound"; readonly jobId: string }
  | {
      readonly _tag: "CannotCancel";
      readonly job: Job;
      readonly reason: string;
    };
export function cancelJob(input: CancelJobInput): CancelJobOutput {
  if (input.job === null) {
    return { _tag: "NotFound", jobId: input.jobId };
  }

  const { job } = input;

  if (job.status === "completed") {
    return { _tag: "CannotCancel", job, reason: "Job is already completed" };
  }

  if (job.status === "failed") {
    return { _tag: "CannotCancel", job, reason: "Job has already failed" };
  }

  if (job.status === "cancelled") {
    return { _tag: "CannotCancel", job, reason: "Job is already cancelled" };
  }

  return { _tag: "Success", job };
}
