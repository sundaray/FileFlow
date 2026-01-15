import { Effect, Option, Match } from "effect";
import { JobStore } from "../job-store.service.js";
import { JobProgress } from "../job-progress.service.js";
import { toProgressEvent } from "../../rules/progress.rule.js";
import type { Job } from "../../types/job.types.js";
import { JobNotFoundError, PipelineError } from "./errors.js";
import { buildPipelineStages } from "./pipeline-builder.js";
import { executePipeline } from "./pipeline-executor.js";

// ─────────────────────────────────────────────────────────────
// The Service
// ─────────────────────────────────────────────────────────────

export class PipelineProcessor extends Effect.Service<PipelineProcessor>()(
  "PipelineProcessor",
  {
    effect: Effect.gen(function* () {
      /**
       * Helper to update job and publish progress
       */
      const updateAndPublish = (
        jobId: string,
        updates: Partial<Job>,
        isFinal: boolean
      ) =>
        Effect.gen(function* () {
          yield* JobStore.update(jobId, updates);

          const maybeJob = yield* JobStore.get(jobId);

          if (Option.isSome(maybeJob)) {
            const job = maybeJob.value;
            const memoryUsage = process.memoryUsage();
            const memoryUsageMb =
              Math.round((memoryUsage.heapUsed / 1024 / 1024) * 100) / 100;
            const event = toProgressEvent({ job, memoryUsageMb, isFinal });
            yield* JobProgress.publish(event);
          }
        });

      /**
       * Mark job as failed with error
       */
      const markJobAsFailed = (jobId: string, error: PipelineError) =>
        updateAndPublish(
          jobId,
          {
            status: "failed",
            completedAt: new Date(),
            error: formatPipelineError(error),
          },
          true
        );

      /**
       * Mark job as completed
       */
      const markJobAsCompleted = (
        jobId: string,
        bytesRead: number,
        bytesWritten: number
      ) =>
        updateAndPublish(
          jobId,
          {
            status: "completed",
            completedAt: new Date(),
            bytesRead,
            bytesWritten,
          },
          true
        );

      /**
       * Mark job as processing
       */
      const markJobAsProcessing = (jobId: string) =>
        updateAndPublish(
          jobId,
          {
            status: "processing",
            startedAt: new Date(),
          },
          false
        );

      return {
        /**
         * Process a job through its configured pipeline.
         * Updates job state and publishes progress as it runs.
         */
        processJob: (jobId: string) =>
          Effect.gen(function* () {
            // Get the job
            const maybeJob = yield* JobStore.get(jobId);

            if (Option.isNone(maybeJob)) {
              return yield* Effect.fail(new JobNotFoundError({ jobId }));
            }

            const job = maybeJob.value;

            // Mark as processing
            yield* markJobAsProcessing(jobId);

            // Build pipeline stages
            const stages = yield* buildPipelineStages(job.pipelineConfig).pipe(
              Effect.tapError((error) => markJobAsFailed(jobId, error))
            );

            // Progress callback
            const onProgress = (bytesRead: number, bytesWritten: number) =>
              updateAndPublish(jobId, { bytesRead, bytesWritten }, false);

            // Execute pipeline
            const result = yield* executePipeline(
              job.inputPath,
              job.outputPath,
              stages,
              onProgress
            ).pipe(Effect.tapError((error) => markJobAsFailed(jobId, error)));

            // Mark as completed
            yield* markJobAsCompleted(
              jobId,
              result.bytesRead,
              result.bytesWritten
            );
          }),
      };
    }),
    dependencies: [JobStore.Default, JobProgress.Default],
    accessors: true,
  }
) {}

// ─────────────────────────────────────────────────────────────
// Error Formatting
// ─────────────────────────────────────────────────────────────

function formatPipelineError(error: PipelineError): string {
  return Match.value(error).pipe(
    Match.tag("JobNotFoundError", ({ jobId }) => `Job ${jobId} not found`),

    Match.tag(
      "UnknownStageTypeError",
      ({ stageType, stageId }) =>
        `Unknown stage type "${stageType}" for stage ${stageId}`
    ),

    Match.tag(
      "PipelineExecutionError",
      ({ cause }) => `Pipeline execution failed: ${String(cause)}`
    ),

    Match.tag(
      "InvalidFilterConfigError",
      ({ field, operator, message }) =>
        `Invalid filter config (field: ${field}, operator: ${operator}): ${message}`
    ),

    Match.tag(
      "InvalidFieldsConfigError",
      ({ message }) => `Invalid fields config: ${message}`
    ),

    Match.tag(
      "UnsupportedCompressionAlgorithmError",
      ({ algorithm }) => `Unsupported compression algorithm: ${algorithm}`
    ),

    Match.tag(
      "CsvParseError",
      ({ cause }) => `CSV parsing failed: ${String(cause)}`
    ),

    Match.tag(
      "FileWriteError",
      ({ path, cause }) => `Failed to write to ${path}: ${String(cause)}`
    ),

    Match.tag(
      "StreamConversionError",
      ({ cause }) => `Stream conversion error: ${String(cause)}`
    ),

    Match.exhaustive
  );
}
