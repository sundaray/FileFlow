import { Router, type Request, type Response } from "express";
import { Effect, Exit, Cause, Match } from "effect";
import {
  handleGetJobs,
  handleGetJob,
  handleDeleteJob,
  handleCancelJob,
} from "../handlers/jobs.handler.js";
import { JobStore } from "../features/jobs/services/job-store.service.js";
import type {
  GetJobsSuccess,
  GetJobSuccess,
  GetJobError,
  DeleteJobSuccess,
  DeleteJobError,
  CancelJobSuccess,
  CancelJobError,
  InternalServerError,
} from "../schema/jobs.schema.js";
import type { JobStatus } from "../types/job.types.js";
import type { AppRuntime } from "../runtime.js";

// ─────────────────────────────────────────────────────────────
// Route Factory
// ─────────────────────────────────────────────────────────────

export function createJobsRoutes(
  runtime: AppRuntime,
): ReturnType<typeof Router> {
  const router: ReturnType<typeof Router> = Router();

  // ─────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────

  function sendInternalServerError(
    res: Response,
    cause: Cause.Cause<never>,
  ): void {
    console.error("Jobs Defect:\n" + Cause.pretty(cause));
    const response: InternalServerError = {
      status: "error",
      code: "INTERNAL_SERVER_ERROR",
      message: "Internal Server Error",
    };
    res.status(500).json(response);
  }

  // ─────────────────────────────────────────────────────────────
  // GET /api/jobs
  // ─────────────────────────────────────────────────────────────
  router.get("/", async (req: Request, res: Response) => {
    const statusParam = req.query.status as string | undefined;
    const filterByStatus = isValidStatus(statusParam) ? statusParam : undefined;

    const exit = await Effect.runPromiseExit(
      handleGetJobs({ filterByStatus }).pipe(Effect.provide(JobStore.Default)),
    );

    Exit.match(exit, {
      onFailure: (cause) => sendInternalServerError(res, cause),

      onSuccess: (result) => {
        const response: GetJobsSuccess = {
          status: "ok",
          jobs: result.output.jobs,
        };
        res.status(200).json(response);
      },
    });
  });

  // ─────────────────────────────────────────────────────────────
  // GET /api/jobs/:jobId
  // ─────────────────────────────────────────────────────────────
  router.get("/:jobId", async (req: Request, res: Response) => {
    const jobId = req.params.jobId as string;

    const exit = await Effect.runPromiseExit(
      handleGetJob({ jobId }).pipe(Effect.provide(JobStore.Default)),
    );

    Exit.match(exit, {
      onFailure: (cause) => sendInternalServerError(res, cause),

      onSuccess: ({ output }) => {
        Match.value(output).pipe(
          Match.tag("NotFound", () => {
            const response: GetJobError = {
              status: "error",
              code: "JOB_NOT_FOUND",
              message: `Job ${jobId} not found`,
            };
            res.status(404).json(response);
          }),

          Match.tag("Success", ({ job }) => {
            const response: GetJobSuccess = {
              status: "ok",
              job: {
                jobId: job.id,
                filename: job.originalFileName,
                status: job.status,
                currentStage: job.currentStageName,
                stageIndex: job.currentStageIndex,
                totalStages: job.totalStages,
                bytesRead: job.bytesRead,
                bytesWritten: job.bytesWritten,
                rowsProcessed: job.rowsProcessed,
                rowsFiltered: job.rowsFiltered,
                startedAt: job.startedAt?.toISOString(),
                updatedAt: job.updatedAt.toISOString(),
                completedAt: job.completedAt?.toISOString(),
                error: job.error,
              },
            };
            res.status(200).json(response);
          }),

          Match.exhaustive,
        );
      },
    });
  });

  // ─────────────────────────────────────────────────────────────
  // DELETE /api/jobs/:jobId
  // ─────────────────────────────────────────────────────────────
  router.delete("/:jobId", async (req: Request, res: Response) => {
    const jobId = req.params.jobId as string;

    const exit = await Effect.runPromiseExit(
      handleDeleteJob({ jobId }).pipe(Effect.provide(JobStore.Default)),
    );

    Exit.match(exit, {
      onFailure: (cause) => sendInternalServerError(res, cause),

      onSuccess: ({ output }) => {
        Match.value(output).pipe(
          Match.tag("NotFound", () => {
            const response: DeleteJobError = {
              status: "error",
              code: "JOB_NOT_FOUND",
              message: `Job ${jobId} not found`,
            };
            res.status(404).json(response);
          }),

          Match.tag("Success", () => {
            const response: DeleteJobSuccess = {
              status: "ok",
              message: "Job deleted successfully",
            };
            res.status(200).json(response);
          }),

          Match.exhaustive,
        );
      },
    });
  });

  // ─────────────────────────────────────────────────────────────
  // POST /api/jobs/:jobId/cancel
  // ─────────────────────────────────────────────────────────────
  router.post("/:jobId/cancel", async (req: Request, res: Response) => {
    const jobId = req.params.jobId as string;

    const exit = await Effect.runPromiseExit(
      handleCancelJob({ jobId }).pipe(Effect.provide(JobStore.Default)),
    );

    Exit.match(exit, {
      onFailure: (cause) => sendInternalServerError(res, cause),
      onSuccess: ({ output }) => {
        Match.value(output).pipe(
          Match.tag("NotFound", () => {
            const response: CancelJobError = {
              status: "error",
              code: "JOB_NOT_FOUND",
              message: `Job ${jobId} not found`,
            };
            res.status(404).json(response);
          }),

          Match.tag("CannotCancel", ({ job, reason }) => {
            const response: CancelJobError = {
              status: "error",
              code: "CANNOT_CANCEL",
              message: "Job cannot be cancelled",
            };
            res.status(409).json(response);
          }),

          Match.tag("Success", () => {
            const response: CancelJobSuccess = {
              status: "ok",
              message: "Job cancelled successfully",
            };
            res.status(200).json(response);
          }),

          Match.exhaustive,
        );
      },
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────
  function isValidStatus(value: string | undefined): value is JobStatus {
    return (
      value !== undefined &&
      ["pending", "processing", "completed", "failed", "cancelled"].includes(
        value,
      )
    );
  }

  return router;
}
