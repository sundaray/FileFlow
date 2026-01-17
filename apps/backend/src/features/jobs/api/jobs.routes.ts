import { Router } from "express";
import { createJobsHandlers } from "./jobs.handlers.ts";
import type { AppRuntime } from "../../../runtime.js";

export function createJobsRoutes(runtime: AppRuntime): Router {
  const router = Router();
  const handlers = createJobsHandlers(runtime);

  router.get("/", handlers.handleGetJobs);
  router.get("/:jobId", handlers.handleGetJob);
  router.delete("/:jobId", handlers.handleDeleteJob);
  router.post("/:jobId/cancel", handlers.handleCancelJob);

  return router;
}
