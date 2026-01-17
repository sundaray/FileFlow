import { Router, type Request, type Response } from "express";
import { Effect, Exit, Match, Cause, Stream, Fiber } from "effect";
import type { AppRuntime } from "../runtime.js";
import {
  handleValidateSubscription,
  handleCreateProgressStream,
  keepAliveStream,
} from "../handlers/progress.handler.js";
import type {
  ProgressJobNotFoundError,
  ProgressStreamError,
  InternalServerError,
} from "../schema/progress.schema.js";
import type { ProgressEvent } from "../types/progress.types.js";

// ─────────────────────────────────────────────────────────────
// Route Factory
// ─────────────────────────────────────────────────────────────

export function createProgressRoutes(
  runtime: AppRuntime
): ReturnType<typeof Router> {
  const router: ReturnType<typeof Router> = Router();

  // ─────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────
  function sendInternalServerError(
    res: Response,
    cause: Cause.Cause<unknown>
  ): void {
    console.error("Progress Defect:\n" + Cause.pretty(cause));

    const resposne: InternalServerError = {
      status: "error",
      code: "INTERNAL_SERVER_ERROR",
      message: "Internal Server Error",
    };

    res.status(500).json(resposne);
  }

  function initializeSSE(res: Response): void {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-ccahe");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
  }

  function sendSSEData(res: Response, data: unknown): void {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  }

  function sendSSEComment(res: Response, comment: string): void {
    res.write(`: ${comment}\n\n`);
  }

  // ─────────────────────────────────────────────────────────────
  // GET /api/progress/:jobId
  // ─────────────────────────────────────────────────────────────
  router.get("/:jobId", async (req: Request, res: Response) => {
    const jobId = req.params.jobId as string;

    // Validate that job exists
    const validationExit = await runtime.runPromiseExit(
      handleValidateSubscription({ jobId })
    );

    const shouldContinue = Exit.match(validationExit, {
      onFailure: (cause) => {
        sendInternalServerError(res, cause);
        return false;
      },

      onSuccess: ({ output }) => {
        return Match.value(output).pipe(
          Match.tag("JobNotFound", () => {
            const response: ProgressJobNotFoundError = {
              status: "error",
              code: "JOB_NOT_FOUND",
              message: `Job ${jobId} not found`,
            };
            res.status(404).json(response);
            return false;
          }),
          Match.tag("Success", () => true),
          Match.exhaustive
        );
      },
    });

    if (!shouldContinue) return;

    //  Initialize SSE connection
    initializeSSE(res);

    // Track connection state
    let isConnectionOpen = true;

    req.on("close", () => {
      isConnectionOpen = false;
    });

    // Create and run the progress stream
    const program = Effect.gen(function* () {
      const progressStream = yield* handleCreateProgressStream(jobId);

      // Fork keepalive stream
      const keepaliveFibre = yield* Effect.fork(
        Stream.runForEach(keepAliveStream, () =>
          Effect.sync(() => {
            if (isConnectionOpen) {
              sendSSEComment(res, "keepalive");
            }
          })
        )
      );

      // Process progress events
      yield* Stream.runForEach(progressStream, (event: ProgressEvent) =>
        Effect.sync(() => {
          if (isConnectionOpen) {
            sendSSEData(res, event);
          }
        })
      );

      // Cleanup
      yield* Fiber.interrupt(keepaliveFibre);

      if (isConnectionOpen) {
        res.end();
      }
    });

    // Run the stream program
    const streamExit = await runtime.runPromiseExit(program);

    Exit.match(streamExit, {
      onFailure: (cause) => {
        console.error("SSE Stream Error:\n" + Cause.pretty(cause));
        if (!res.headersSent) {
          const response: ProgressStreamError = {
            status: "error",
            code: "STREAM_ERROR",
            message: "Error streaming progress",
          };

          res.status(500).json(response);
        }
      },
      onSuccess: () => {
        // Stream completed successfully.
      },
    });
  });

  return router;
}
