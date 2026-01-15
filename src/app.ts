/**
 * Express Application Configuration
 */

import express, { type Request, type Response, type Express } from "express";
import { makeAppRuntime } from "./runtime.js";
import type { AppRuntime } from "./runtime.js";

import { createHealthRoutes } from "./routes/health.routes.js";
import { createStagesRoutes } from "./routes/stages.routes.js";
import { createJobsRoutes } from "./routes/jobs.routes.js";
import { createDownloadRoutes } from "./routes/download.routes.js";
import { createProgressRoutes } from "./routes/progress.routes.js";
import { createUploadRoutes } from "./routes/upload.route.js";

const app: Express = express();
const runtime: AppRuntime = makeAppRuntime();

app.use("/api/health", createHealthRoutes(runtime));
app.use("/api/stages", createStagesRoutes(runtime));
app.use("/api/jobs", createJobsRoutes(runtime));
app.use("/api/download", createDownloadRoutes(runtime));
app.use("/api/progress", createProgressRoutes(runtime));
app.use("/api/upload", createUploadRoutes(runtime));

export default app;
