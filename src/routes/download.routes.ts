import { Router, type Request, type Response } from "express";
import { Exit, Cause, Match } from "effect";
import { createReadStream } from "node:fs";
import type { AppRuntime } from "../runtime.js";
import {
  handleDownload,
  handleGetFileinfo,
} from "../handlers/download.handler.js";
import type {
  DownloadJobNotFoundError,
  DownloadJobNotCompletedError,
  DownloadOutputFileNotFoundError,
  DownloadStreamError,
  InternalServerError,
} from "../schema/download.schema.js";

export function createDownloadroutes(
  runtime: AppRuntime
): ReturnType<typeof Router> {
  const router = Router();

  // ─────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────
  function sendInternalServerError(
    res: Response,
    cause: Cause.Cause<unknown>
  ): void {
    console.error("Download defect:\n" + Cause.pretty(cause));

    const response = {
      status: "error",
      code: "INTERNAL_SERVER_ERROR",
      message: "Internal Server Error",
    };

    res.status(500).json(response);
  }

  async function streamFile(res: Response, filePath: string): Promise<void> {
    const exit = await runtime.runPromiseExit(handleGetFileinfo({ filePath }));

    Exit.match(exit, {
      onFailure: (cause) => {
        console.error("Get File Info Defect:\n" + Cause.pretty(cause));
        const response: InternalServerError = {
          status: "error",
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to read file info",
        };
        res.status(500).json(response);
      },

      onSuccess: ({ fileInfo }) => {
        res.setHeader("Content-Type", fileInfo.contentType);
        res.setHeader("Content-Length", fileInfo.size);
        res.setHeader(
          "Content-Disposition",
          `attachment; fileName="${fileInfo.fileName}"`
        );
        res.setHeader("Cache-Control", "no-cache");

        const fileStream = createReadStream(filePath);

        fileStream.on("error", (error) => {
          console.error("Stream error:", error);
          if (!res.headersSent) {
            const response: DownloadStreamError = {
              status: "error",
              code: "STREAM_ERROR",
              message: "Error streaming file",
            };
            res.status(500).json(response);
          }
        });

        fileStream.pipe(res);
      },
    });
  }
  // ─────────────────────────────────────────────────────────────
  // GET /api/download/:jobId
  // ─────────────────────────────────────────────────────────────
  router.get("/:jobId", async (req: Request, res: Response) => {
    const jobId = req.params.jobId as string;

    const exit = await runtime.runPromiseExit(handleDownload({ jobId }));

    Exit.match(exit, {
      onFailure: (cause) => sendInternalServerError(res, cause),

      onSuccess: ({ output }) => {
        Match.value(output).pipe(
          Match.tag("JobNotFound", () => {
            const response: DownloadJobNotFoundError = {
              status: "error",
              code: "JOB_NOT_FOUND",
              message: `Job ${jobId} not found.`,
            };
            res.status(404).json(response);
          }),

          Match.tag("JobNotCompleted", ({ job, reason }) => {
            const response: DownloadJobNotCompletedError = {
              status: "error",
              code: "JOB_NOT_COMPLETED",
              message: reason,
              currentStatus: job.status,
            };
            res.status(409).json(response);
          }),

          Match.tag("OutputFileNotFound", () => {
            const response: DownloadOutputFileNotFoundError = {
              status: "error",
              code: "OUTPUT_FILE_NOT_FOUND",
              message: "Output file not found on disk",
            };
            res.status(404).json(response);
          }),

          Match.tag("Success", ({ job }) => {
            streamFile(res, job.outputPath);
          }),

          Match.exhaustive
        );
      },
    });
  });
  return router;
}
