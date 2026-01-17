import { Router, type Request, type Response } from "express";
import { Effect, Exit, Cause, Match } from "effect";
import type { AppRuntime } from "../runtime.js";
import { handleHealthCheck } from "../handlers/health.handler.js";
import type {
  HealthyResponse,
  UnhealthyResponse,
  ErrorResponse,
} from "../schema/health.schema.js";

// ─────────────────────────────────────────────────────────────
// Route Factory
// ─────────────────────────────────────────────────────────────

export function createHealthRoutes(
  runtime: AppRuntime
): ReturnType<typeof Router> {
  const router: ReturnType<typeof Router> = Router();

  // ─────────────────────────────────────────────────────────────
  // GET /api/health
  // ─────────────────────────────────────────────────────────────

  router.get("/", async (req: Request, res: Response) => {
    const exit = await Effect.runPromiseExit(handleHealthCheck());

    Exit.match(exit, {
      onFailure: (cause) => {
        console.error("Health check defect: \n" + Cause.pretty(cause));
        const response: ErrorResponse = {
          status: "error",
          message: "Internal Server Error",
        };

        res.status(500).json(response);
      },

      onSuccess: ({ decision, timestamp }) => {
        Match.value(decision).pipe(
          Match.tag("Healthy", () => {
            const response: HealthyResponse = {
              status: "ok",
              timestamp,
            };

            res.status(200).json(response);
          }),

          Match.tag("Unhealthy", (data) => {
            const response: UnhealthyResponse = {
              status: "unhealthy",
              reason: data.reason,
              timestamp,
            };

            // 503 Service Unavailable - Server is not ready to handle the request
            return res.status(503).json(response);
          }),

          Match.exhaustive
        );
      },
    });
  });

  return router;
}
