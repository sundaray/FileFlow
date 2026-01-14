/**
 * Progress Business Rule
 */

import type { Job } from "../types/job.types.js";
import type { ProgressEvent } from "../types/progress.types.js";

// ─────────────────────────────────────────────────────────────
// Can Subscribe - Input
// ─────────────────────────────────────────────────────────────

export interface CanSubscribeInput {
  job: Job | null;
  jobId: string;
}

// ─────────────────────────────────────────────────────────────
// Can Subscribe - Output
// ─────────────────────────────────────────────────────────────

export type CanSubscribeOutput =
  | { _tag: "Success"; job: Job }
  | { _tag: "JobNotFound"; jobId: string };

// ─────────────────────────────────────────────────────────────
// Can Subscribe - Rule
// ─────────────────────────────────────────────────────────────

export function canSubscribe(input: CanSubscribeInput): CanSubscribeOutput {
  if (input.job === null) {
    return { _tag: "JobNotFound", jobId: input.jobId };
  }

  return { _tag: "Success", job: input.job };
}

// ─────────────────────────────────────────────────────────────
// To Progress Event - Input
// ─────────────────────────────────────────────────────────────

export interface ToProgressEventInput {
  readonly job: Job;
  readonly memoryUsageMb: number;
  readonly isFinal: boolean;
}
// ─────────────────────────────────────────────────────────────
// To Progress Event - Pure Transformation
// ─────────────────────────────────────────────────────────────

export function toProgressEvent(input: ToProgressEventInput): ProgressEvent {
  const { job, memoryUsageMb, isFinal } = input;

  return {
    jobId: job.id,
    status: job.status,
    currentStage: job.currentStageName,
    stageIndex: job.currentStageIndex,
    totalStages: job.totalStages,
    bytesRead: job.bytesRead,
    bytesWritten: job.bytesWritten,
    rowsProcessed: job.rowsProcessed,
    rowsFiltered: job.rowsFiltered,
    startedAt: (job.startedAt ?? job.createdAt).toISOString(),
    updatedAt: job.updatedAt.toISOString(),
    completedAt: job.completedAt?.toISOString() ?? null,
    error: job.error,
    memoryUsageMb,
    final: isFinal ? true : undefined,
  };
}

// ─────────────────────────────────────────────────────────────
// Terminal Status Check
// ─────────────────────────────────────────────────────────────

export function isTerminalStatus(job: Job): boolean {
  return (
    job.status === "completed" ||
    job.status === "failed" ||
    job.status === "cancelled"
  );
}
