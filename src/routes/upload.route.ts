import { Router, type Request, type Response } from "express";
import { Effect, Exit, Cause, Match } from "effect";
import type { AppRuntime } from "../runtime.js";
import {
  handleValidateUpload,
  handleCreateJob,
} from "../handlers/upload.handler.js";
import { JobStore } from "../services/job-store.service.js";
import { FileStream } from "../services/file-stream.service.js";
import { PipelineProcessor } from "../services/pipeline-processor.service.js";
import type {
  UploadSuccess,
  UploadMissingFilenameError,
  UploadMissingPipelineConfigError,
  UploadInvalidPipelineConfigError,
  UploadInvalidPipelineStructureError,
  UploadFileTooLargeError,
  UploadStreamError,
  InternalServerError,
} from "../schema/upload.schema.js";

// ─────────────────────────────────────────────────────────────
// Route Factory
// ─────────────────────────────────────────────────────────────

export function createUploadRoutes(
  runtime: AppRuntime
): ReturnType<typeof Router> {
  const router: ReturnType<typeof Router> = Router();

  // ─────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────

  function sendInternalError(res: Response, cause: Cause.Cause<never>): void {
    console.error("Upload Defect:\n" + Cause.pretty(cause));
    const response: InternalServerError = {
      status: "error",
      code: "INTERNAL_SERVER_ERROR",
      message: "Internal Server Error",
    };
    res.status(500).json(response);
  }

  // ─────────────────────────────────────────────────────────────
  // POST /api/upload
  // ─────────────────────────────────────────────────────────────

  router.post("/", async (req: Request, res: Response) => {
    // 1. Extract headers
    const fileName = req.headers["x-filename"] as string | undefined;
    const pipelineConfigRaw = req.headers["x-pipeline-config"] as
      | string
      | undefined;
    const contentLength = req.headers["content-length"]
      ? parseInt(req.headers["content-length"], 10)
      : undefined;

    // 2. Validate request
    const validationExit = await runtime.runPromiseExit(
      handleValidateUpload({
        fileName,
        pipelineConfigRaw,
        contentLength,
      })
    );

    // Handle validation result
    const validatedInput = Exit.match(validationExit, {
      onFailure: (cause) => {
        sendInternalError(res, cause);
        return null;
      },

      onSuccess: ({ output }) => {
        return Match.value(output).pipe(
          Match.tag("MissingFileName", () => {
            const response: UploadMissingFilenameError = {
              status: "error",
              code: "MISSING_FILENAME",
              message: "Missing x-filename header",
            };
            res.status(400).json(response);
            return null;
          }),

          Match.tag("MissingPipelineConfig", () => {
            const response: UploadMissingPipelineConfigError = {
              status: "error",
              code: "MISSING_PIPELINE_CONFIG",
              message: "Missing x-pipeline-config header",
            };
            res.status(400).json(response);
            return null;
          }),

          Match.tag("InvalidPipelineConfig", ({ error }) => {
            const response: UploadInvalidPipelineConfigError = {
              status: "error",
              code: "INVALID_PIPELINE_CONFIG",
              message: "Invalid pipeline configuration JSON",
            };
            res.status(400).json(response);
            return null;
          }),

          Match.tag("InvalidPipelineStructure", ({ error }) => {
            const response: UploadInvalidPipelineStructureError = {
              status: "error",
              code: "INVALID_PIPELINE_STRUCTURE",
              message: "Invalid pipeline structure",
            };
            res.status(400).json(response);
            return null;
          }),

          Match.tag("FileTooLarge", ({ maxBytes }) => {
            const response: UploadFileTooLargeError = {
              status: "error",
              code: "FILE_TOO_LARGE",
              message: "File size exceeds maximum allowed size",
              maxBytes,
            };
            res.status(413).json(response);
            return null;
          }),

          Match.tag("Success", (data) => data),

          Match.exhaustive
        );
      },
    });

    if (validatedInput === null) return;

    // 3. Create job and stream file
    const uploadExit = await runtime.runPromiseExit(
      Effect.gen(function* () {
        // Create job record
        const { job } = yield* handleCreateJob({
          filename: validatedInput.filename,
          pipelineConfig: validatedInput.pipelineConfig,
        });

        // Ensure upload directory exists
        yield* FileStream.ensureDir(job.inputPath);

        // Stream file to disk
        const bytesWritten = yield* FileStream.streamToFile(req, job.inputPath);

        // Update job with bytes read
        yield* JobStore.update(job.id, { bytesRead: bytesWritten });

        return job;
      })
    );

    Exit.match(uploadExit, {
      onFailure: (cause) => {
        console.error("Upload Stream Error:\n" + Cause.pretty(cause));
        const response: UploadStreamError = {
          status: "error",
          code: "UPLOAD_STREAM_ERROR",
          message: "Failed to upload file",
        };
        res.status(500).json(response);
      },

      onSuccess: (job) => {
        // 4. Respond with 202 Accepted
        const response: UploadSuccess = {
          status: "ok",
          jobId: job.id,
          message: "File uploaded successfully, processing started",
        };
        res.status(202).json(response);

        // 5. Process file in background (don't await)
        runtime
          .runPromise(PipelineProcessor.processJob(job.id))
          .catch((error) => {
            console.error(
              `Background processing failed for job ${job.id}:`,
              error
            );
          });
      },
    });
  });

  return router;
}
