import express, {
  type Request,
  type Response,
  type Express,
  type NextFunction,
} from "express";
import cors from "cors";
import { makeAppRuntime } from "./runtime.js";
import type { AppRuntime } from "./runtime.js";
import { logger } from "./logger.js";

import { createHealthRoutes } from "./routes/health.routes.js";
import { createStagesRoutes } from "./routes/stages.routes.js";
import { createJobsRoutes } from "./routes/jobs.routes.js";
import { createDownloadRoutes } from "./routes/download.routes.js";
import { createProgressRoutes } from "./routes/progress.routes.js";
import { createUploadRoutes } from "./routes/upload.route.js";

const app: Express = express();
const runtime: AppRuntime = makeAppRuntime();

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowHeaders: [
    "Content-Type",
    "Authorization",
    "X-Filename",
    "X-Pipeline-Config",
  ],
  credentials: true,
};

app.use(cors(corsOptions));

// Routes
app.use("/api/health", createHealthRoutes(runtime));
app.use("/api/stages", createStagesRoutes(runtime));
app.use("/api/jobs", createJobsRoutes(runtime));
app.use("/api/download", createDownloadRoutes(runtime));
app.use("/api/progress", createProgressRoutes(runtime));
app.use("/api/upload", createUploadRoutes(runtime));

// Global error handler
app.use(function (err: Error, req: Request, res: Response, next: NextFunction) {
  logger.error({ err, path: req.path, method: req.method }, "Unhandled error");

  const isDev = process.env.NODE_ENV !== "production";

  res.status(500).json({
    error: "Internal Server Error",
    message: isDev ? err.message : undefined,
  });
});

export default app;
