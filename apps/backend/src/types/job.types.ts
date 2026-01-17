/**
 * Job Types
 */

// ─────────────────────────────────────────────────────────────
// Job Status
// ─────────────────────────────────────────────────────────────

export type JobStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled";

// ─────────────────────────────────────────────────────────────
// Pipeline Stage Config
// ─────────────────────────────────────────────────────────────
export interface StageConfig {
  readonly id: string;
  readonly type: string;
  readonly enabled: boolean;
  readonly options: Record<string, unknown>;
}

export interface PipelineConfig {
  readonly stages: ReadonlyArray<StageConfig>;
}

export interface Job {
  readonly id: string;
  readonly fileName: string;
  readonly originalFileName: string;
  readonly pipelineConfig: PipelineConfig;
  readonly status: JobStatus;
  readonly inputPath: string;
  readonly outputPath: string;
  readonly bytesRead: number;
  readonly bytesWritten: number;
  readonly rowsProcessed: number;
  readonly rowsFiltered: number;
  readonly currentStageIndex: number;
  readonly totalStages: number;
  readonly currentStageName: string | null;
  readonly createdAt: Date;
  readonly startedAt: Date | null;
  readonly completedAt: Date | null;
  readonly updatedAt: Date;
  readonly error: string | null;
}

export interface JobSummary {
  readonly jobId: string;
  readonly fileName: string;
  readonly status: JobStatus;
  readonly createdAt: Date;
  readonly completedAt: Date | null;
  readonly bytesRead: number;
  readonly bytesWritten: number;
}
