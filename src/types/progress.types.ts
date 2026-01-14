/**
 * Progress Event Types
 *
 * Types for real-time job progress updates via SSE
 */

import type { JobStatus } from "./job.types.js";

// ─────────────────────────────────────────────────────────────
// Progress Event (sent to client via SSE)
// ─────────────────────────────────────────────────────────────

export interface ProgressEvent {
  jobId: string;
  status: JobStatus;
  currentStage: string | null;
  stageIndex: number;
  totalStages: number;
  bytesRead: number;
  bytesWritten: number;
  rowsProcessed: number;
  rowsFiltered: number;
  startedAt: string;
  updatedAt: string;
  completedAt: string | null;
  error: string | null;
  memoryUsageMb: number;
  final?: boolean;
}
