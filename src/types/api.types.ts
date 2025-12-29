import type { PipelineConfig } from './pipeline.types.js';
import type { ProgressEvent } from './events.types.js';

// POST /api/upload
export interface UploadRequestHeaders {
  'x-filename': string;
  'x-pipeline-config': string;  // JSON stringified PipelineConfig
  'content-type': string;
  'content-length'?: string;
}

export interface UploadResponse {
  success: true;
  jobId: string;
  message: string;
}

// GET /api/jobs
export interface JobSummary {
  jobId: string;
  filename: string;
  status: ProgressEvent['status'];
  createdAt: string;
  completedAt: string | null;
  bytesRead: number;
  bytesWritten: number;
}

export interface ListJobsResponse {
  success: true;
  jobs: JobSummary[];
}

// GET /api/jobs/:jobId
export interface JobDetailsResponse {
  success: true;
  job: ProgressEvent & {
    filename: string;
    pipelineConfig: PipelineConfig;
  };
}

// DELETE /api/jobs/:jobId
export interface DeleteJobResponse {
  success: true;
  message: string;
}

// GET /api/stages
export interface ListStagesResponse {
  success: true;
  stages: import('./pipeline.types.js').StageDefinition[];
}

// Error response
export interface ErrorResponse {
  success: false;
  error: string;
  code: string;
  details?: unknown;
}
