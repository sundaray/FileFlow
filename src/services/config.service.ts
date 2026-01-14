import { Effect } from "effect";
import { Path } from "@effect/platform";
import { NodePath } from "@effect/platform-node";

// ─────────────────────────────────────────────────────────────
// Config Values
// ─────────────────────────────────────────────────────────────
export interface ConfigValues {
  port: number;
  uploadsDir: string;
  outputsDir: string;
  maxFileSizeBytes: number;
  jobRetentionMs: number;
  corsOrigin: string;
}

// ─────────────────────────────────────────────────────────────
// The Service
// ─────────────────────────────────────────────────────────────
export class Config extends Effect.Service<Config>()("Config", {
  effect: Effect.gen(function* () {
    const path = yield* Path.Path;

    const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

    const uploadsDir = path.resolve("uploadss");
    const outputsDir = path.resolve("outputs");

    const maxFileSizeBytes = 10 * 1024 * 1024 * 1024; // 10 GB
    const jobRetentionMs = 60 * 60 * 1000; // 1 hour
    const corsOrigin = process.env.CORS_ORIGIN || "http://localhost:3000";

    return {
      port,
      uploadsDir,
      outputsDir,
      maxFileSizeBytes,
      jobRetentionMs,
      corsOrigin,
    } satisfies ConfigValues;
  }),
  dependencies: [NodePath.layer],
  accessors: true,
}) {}
