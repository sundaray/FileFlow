import type { Transform, Readable, Writable } from 'node:stream';
import type { PipelineConfig } from '../types/pipeline.types.js';
import type { JobStatus, ProgressEvent } from '../types/events.types.js';

export interface Job {
  id: string;
  filename: string;
  originalFilename: string;
  pipelineConfig: PipelineConfig;
  status: JobStatus;
  
  // Paths
  inputPath: string;
  outputPath: string;
  
  // Metrics
  bytesRead: number;
  bytesWritten: number;
  rowsProcessed: number;
  rowsFiltered: number;
  
  // Stage tracking
  currentStageIndex: number;
  totalStages: number;
  currentStageName: string | null;
  
  // Timestamps
  createdAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
  updatedAt: Date;
  
  // Error info
  error: string | null;
  
  // Active streams (for cancellation)
  activeStreams: Array<Readable | Writable | Transform>;
  
  // SSE subscribers (response objects waiting for progress)
  subscribers: Set<import('express').Response>;
}

export type CreateJobInput = {
  filename: string;
  pipelineConfig: PipelineConfig;
  inputPath: string;
  outputPath: string;
};
