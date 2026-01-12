import { Router, type Request, type Response } from "express";
import { Effect, Exit, Match } from "effect";
import { handleHealthCheck } from "../handlers/health.handler.js";
import type {
  HealthyResponse,
  UnhealthyResponse,
  ErrorResponse,
} from "../schema/health.schema.js";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  const exit = await Effect.runPromiseExit(handleHealthCheck());

  Exit.match(exit, {
    onFailure: () => {
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
