/**
 * FileFlow Frontend Types
 */

// ─────────────────────────────────────────────────────────────
// Job Types
// ─────────────────────────────────────────────────────────────

export type JobStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled";

export type TextTransform = "uppercase" | "lowercase";

export interface JobSummary {
  readonly jobId: string;
  readonly fileName: string;
  readonly status: JobStatus;
  readonly createdAt: string;
  readonly completedAt: string | null;
  readonly bytesRead: number;
  readonly bytesWritten: number;
}

export interface JobDetails {
  readonly jobId: string;
  readonly filename: string;
  readonly status: JobStatus;
  readonly currentStage: string | null;
  readonly stageIndex: number;
  readonly totalStages: number;
  readonly bytesRead: number;
  readonly bytesWritten: number;
  readonly rowsProcessed: number;
  readonly rowsFiltered: number;
  readonly startedAt?: string;
  readonly updatedAt: string;
  readonly completedAt?: string;
  readonly error: string | null;
}

// ─────────────────────────────────────────────────────────────
// Progress Event (SSE)
// ─────────────────────────────────────────────────────────────

export interface ProgressEvent {
  readonly jobId: string;
  readonly status: JobStatus;
  readonly currentStage: string | null;
  readonly stageIndex: number;
  readonly totalStages: number;
  readonly bytesRead: number;
  readonly bytesWritten: number;
  readonly rowsProcessed: number;
  readonly rowsFiltered: number;
  readonly startedAt: string;
  readonly updatedAt: string;
  readonly completedAt: string | null;
  readonly error: string | null;
  readonly memoryUsageMb: number;
  readonly final?: boolean;
}

// ─────────────────────────────────────────────────────────────
// Pipeline Configuration
// ─────────────────────────────────────────────────────────────

export interface StageConfig {
  readonly id: string;
  readonly type: string;
  readonly enabled: boolean;
  readonly options: Record<string, unknown>;
}

export interface PipelineConfig {
  readonly stages: readonly StageConfig[];
}

// ─────────────────────────────────────────────────────────────
// API Responses
// ─────────────────────────────────────────────────────────────

export interface ApiSuccessResponse<T> {
  readonly status: "ok";
  readonly data?: T;
}

export interface ApiErrorResponse {
  readonly status: "error";
  readonly code: string;
  readonly message: string;
}

export interface GetJobsResponse {
  readonly status: "ok";
  readonly jobs: readonly JobSummary[];
}

export interface GetJobResponse {
  readonly status: "ok";
  readonly job: JobDetails;
}

export interface UploadResponse {
  readonly status: "ok";
  readonly jobId: string;
  readonly message: string;
}

// ─────────────────────────────────────────────────────────────
// Upload Form State
// ─────────────────────────────────────────────────────────────

export interface UploadFormState {
  readonly file: File | null;
  readonly textTransform: TextTransform | null;
  readonly isUploading: boolean;
  readonly error: string | null;
}
