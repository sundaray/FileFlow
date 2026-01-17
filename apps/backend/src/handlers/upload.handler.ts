import { Effect, Option } from "effect";
import { randomUUID } from "node:crypto";
import { JobStore } from "../features/jobs/services/job-store.service.js";
import { Config } from "../services/config.service.js";
import {
  validateUpload,
  createJobParams,
  type ValidateUploadOutput,
} from "../rules/upload.rule.js";
import type { Job } from "../types/job.types.js";

// ─────────────────────────────────────────────────────────────
// Validate Upload Handler
// ─────────────────────────────────────────────────────────────

export interface ValidateUploadHandlerInput {
  fileName: string | undefined;
  pipelineConfigRaw: string | undefined;
  contentLength: number | undefined;
}

export interface ValidateUploadHandlerOutput {
  output: ValidateUploadOutput;
}

export function handleValidateUpload(
  input: ValidateUploadHandlerInput,
): Effect.Effect<ValidateUploadHandlerOutput, never, Config> {
  return Effect.gen(function* () {
    const config = yield* Config;

    const output = validateUpload({
      fileName: input.fileName,
      pipelineConfigRaw: input.pipelineConfigRaw,
      contentLength: input.contentLength,
      maxFileSizeBytes: config.maxFileSizeBytes,
    });

    return { output };
  });
}

// ─────────────────────────────────────────────────────────────
// Create Job Handler
// ─────────────────────────────────────────────────────────────
export interface CreateJobHandlerInput {
  fileName: string;
  pipelineConfig: Job["pipelineConfig"];
}

export interface CreateJobHandlerOutput {
  job: Job;
}

export function handleCreateJob(
  input: CreateJobHandlerInput,
): Effect.Effect<CreateJobHandlerOutput, never, JobStore | Config> {
  return Effect.gen(function* () {
    const config = yield* Config;

    const jobId = randomUUID();
    const now = new Date();

    const jobParams = createJobParams({
      jobId,
      filename: input.fileName,
      pipelineConfig: input.pipelineConfig,
      uploadsDir: config.uploadsDir,
      outputsDir: config.outputsDir,
    });

    const job: Job = {
      id: jobParams.id,
      fileName: jobParams.safeFilename,
      originalFileName: jobParams.filename,
      pipelineConfig: jobParams.pipelineConfig,
      status: "pending",
      inputPath: jobParams.inputPath,
      outputPath: jobParams.outputPath,
      bytesRead: 0,
      bytesWritten: 0,
      rowsProcessed: 0,
      rowsFiltered: 0,
      currentStageIndex: 0,
      totalStages: jobParams.totalStages,
      currentStageName: null,
      createdAt: now,
      startedAt: null,
      completedAt: null,
      updatedAt: now,
      error: null,
    };

    yield* JobStore.set(job);

    return { job };
  });
}
