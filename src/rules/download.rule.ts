/**
 * Download Business Rule
 */

import type { Job, JobStatus } from "../types/job.types.js";

// ─────────────────────────────────────────────────────────────
// Input
// ─────────────────────────────────────────────────────────────
export interface DownloadInput {
  readonly job: Job | null;
  readonly jobId: string;
  readonly outputFileExists: boolean;
}

// ─────────────────────────────────────────────────────────────
// Output
// ─────────────────────────────────────────────────────────────

export type DownloadOutput =
  | { readonly _tag: "Success"; readonly job: Job }
  | { readonly _tag: "JobNotFound"; readonly jobId: string }
  | {
      readonly _tag: "JobNotCompleted";
      readonly job: Job;
      readonly reason: string;
    }
  | {
      readonly _tag: "OutputFileNotFound";
      readonly job: Job;
    };

// ─────────────────────────────────────────────────────────────
// The Rule
// ─────────────────────────────────────────────────────────────

export function canDownload(input: DownloadInput): DownloadOutput {
  const { job, jobId, outputFileExists } = input;

  if (job === null) {
    return { _tag: "JobNotFound", jobId };
  }

  if (job.status !== "completed") {
    const reason = getNotCompletedReason(job.status);
    return { _tag: "JobNotCompleted", job, reason };
  }

  if (!outputFileExists) {
    return { _tag: "OutputFileNotFound", job };
  }

  return { _tag: "Success", job };
}

// ─────────────────────────────────────────────────────────────
// Helper
// ─────────────────────────────────────────────────────────────
function getNotCompletedReason(status: JobStatus): string {
  switch (status) {
    case "pending":
      return "Job is pending";
    case "processing":
      return "Job is still processing";
    case "failed":
      return "Job failed";
    case "cancelled":
      return "Job was cancelled";
    default:
      return "Job is not completed";
  }
}
