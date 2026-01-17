import { Effect, Option } from "effect";
import { JobStore } from "../features/jobs/services/job-store.service.js";
import {
  getJobs,
  getJob,
  deleteJob,
  cancelJob,
  type GetJobsOutput,
  type GetJobOutput,
  type DeleteJobOutput,
  type CancelJobOutput,
} from "../rules/jobs.rule.js";
import type { JobStatus } from "../types/job.types.js";

// ─────────────────────────────────────────────────────────────
// Get Jobs Handler
// ─────────────────────────────────────────────────────────────
export interface GetJobsHandlerInput {
  readonly filterByStatus?: JobStatus;
}

export interface GetJobsHandlerOutput {
  readonly output: GetJobsOutput;
}

export function handleGetJobs(
  input: GetJobsHandlerInput,
): Effect.Effect<GetJobsHandlerOutput, never, JobStore> {
  return Effect.gen(function* () {
    const jobs = yield* JobStore.getAll;

    const output = getJobs({ jobs, filterByStatus: input.filterByStatus });

    return { output };
  });
}
// ─────────────────────────────────────────────────────────────
// Get Job Handler
// ─────────────────────────────────────────────────────────────
export interface GetJobHandlerInput {
  readonly jobId: string;
}

export interface GetJobHandlerOuput {
  readonly output: GetJobOutput;
}

export function handleGetJob(
  input: GetJobHandlerInput,
): Effect.Effect<GetJobHandlerOuput, never, JobStore> {
  return Effect.gen(function* () {
    const mayBeJob = yield* JobStore.get(input.jobId);
    const job = Option.getOrNull(mayBeJob);

    const output = getJob({ job, jobId: input.jobId });

    return { output };
  });
}
// ─────────────────────────────────────────────────────────────
// Delete Job Handler
// ─────────────────────────────────────────────────────────────
export interface DeleteJobHandlerInput {
  readonly jobId: string;
}

export interface DeleteJobHandlerOutput {
  readonly output: DeleteJobOutput;
}

export function handleDeleteJob(
  input: DeleteJobHandlerInput,
): Effect.Effect<DeleteJobHandlerOutput, never, JobStore> {
  return Effect.gen(function* () {
    const maybeJob = yield* JobStore.get(input.jobId);
    const job = Option.getOrNull(maybeJob);

    const output = deleteJob({ job, jobId: input.jobId });

    if (output._tag === "Success") {
      yield* JobStore.remove(input.jobId);
    }

    return { output };
  });
}
// ─────────────────────────────────────────────────────────────
// Cancel Job Handler
// ─────────────────────────────────────────────────────────────
export interface CancelJobHandlerInput {
  readonly jobId: string;
}

export interface CancelJobHandlerOutput {
  readonly output: CancelJobOutput;
}

export function handleCancelJob(
  input: CancelJobHandlerInput,
): Effect.Effect<CancelJobHandlerOutput, never, JobStore> {
  return Effect.gen(function* () {
    const maybeJob = yield* JobStore.get(input.jobId);
    const job = Option.getOrNull(maybeJob);

    const output = cancelJob({ job, jobId: input.jobId });

    if (output._tag === "Success") {
      yield* JobStore.update(input.jobId, {
        status: "cancelled",
        completedAt: new Date(),
        error: "Job cancelled by user",
      });
    }
    return { output };
  });
}
