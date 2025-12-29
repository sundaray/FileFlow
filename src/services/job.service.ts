import type { Job } from '../jobs/job.types.js';
import type { ProgressEvent } from '../types/events.types.js';
import type { PipelineConfig } from '../types/pipeline.types.js';
import { jobStore } from '../jobs/job.store.js';
import { config } from '../config/index.js';
import { join } from 'node:path';
import { unlink } from 'node:fs/promises';
import { v4 as uuidv4 } from 'uuid';

export function createJob(filename: string, pipelineConfig: PipelineConfig): Job {
  const jobId = uuidv4();
  const safeFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');

  // Determine output extension based on pipeline
  const hasCompress = pipelineConfig.stages.some(
    s => s.enabled && s.type === 'compress'
  );
  const compressStage = pipelineConfig.stages.find(
    s => s.enabled && s.type === 'compress'
  );
  const compressAlgo = compressStage?.type === 'compress'
    ? compressStage.options.algorithm
    : 'gzip';

  const outputExtension = hasCompress ? `.${compressAlgo === 'gzip' ? 'gz' : compressAlgo === 'brotli' ? 'br' : 'deflate'}` : '';

  const inputPath = join(config.uploadsDir, `${jobId}-${safeFilename}`);
  const outputPath = join(config.outputsDir, `${jobId}-processed${outputExtension}`);

  return jobStore.create({
    filename: safeFilename,
    pipelineConfig,
    inputPath,
    outputPath,
  });
}

export function getJob(jobId: string): Job | undefined {
  return jobStore.get(jobId);
}

export function getAllJobs(): Job[] {
  return jobStore.getAll();
}

export function updateJobProgress(jobId: string, updates: Partial<Job>): void {
  const job = jobStore.update(jobId, updates);
  if (job) {
    const event = jobToProgressEvent(job);
    jobStore.notifySubscribers(jobId, event);
  }
}

export function markJobStarted(jobId: string): void {
  jobStore.update(jobId, {
    status: 'processing',
    startedAt: new Date(),
  });

  const job = jobStore.get(jobId);
  if (job) {
    jobStore.notifySubscribers(jobId, jobToProgressEvent(job));
  }
}

export function markJobCompleted(jobId: string, bytesWritten: number): void {
  const completedAt = new Date();
  jobStore.update(jobId, {
    status: 'completed',
    completedAt,
    bytesWritten,
    currentStageName: null,
  });

  const job = jobStore.get(jobId);
  if (job) {
    const event = jobToProgressEvent(job);
    jobStore.notifySubscribers(jobId, event);

    // Close SSE connections after final event
    for (const subscriber of job.subscribers) {
      subscriber.write(`data: ${JSON.stringify({ ...event, final: true })}\n\n`);
      subscriber.end();
    }
    job.subscribers.clear();
  }
}

export function markJobFailed(jobId: string, error: string): void {
  const completedAt = new Date();
  jobStore.update(jobId, {
    status: 'failed',
    completedAt,
    error,
    currentStageName: null,
  });

  const job = jobStore.get(jobId);
  if (job) {
    const event = jobToProgressEvent(job);
    jobStore.notifySubscribers(jobId, event);

    for (const subscriber of job.subscribers) {
      subscriber.write(`data: ${JSON.stringify({ ...event, final: true })}\n\n`);
      subscriber.end();
    }
    job.subscribers.clear();
  }
}

export async function cancelJob(jobId: string): Promise<boolean> {
  const job = jobStore.get(jobId);
  if (!job) return false;

  if (job.status !== 'pending' && job.status !== 'processing') {
    return false; // Can only cancel pending or processing jobs
  }

  // Destroy all active streams
  for (const stream of job.activeStreams) {
    stream.destroy(new Error('Job cancelled'));
  }

  jobStore.update(jobId, {
    status: 'cancelled',
    completedAt: new Date(),
    error: 'Job cancelled by user',
  });

  // Notify subscribers
  const updatedJob = jobStore.get(jobId);
  if (updatedJob) {
    const event = jobToProgressEvent(updatedJob);
    for (const subscriber of updatedJob.subscribers) {
      subscriber.write(`data: ${JSON.stringify({ ...event, final: true })}\n\n`);
      subscriber.end();
    }
    updatedJob.subscribers.clear();
  }

  // Try to clean up files
  try {
    await unlink(job.inputPath).catch(() => {});
    await unlink(job.outputPath).catch(() => {});
  } catch {
    // Ignore cleanup errors
  }

  return true;
}

export async function deleteJob(jobId: string): Promise<boolean> {
  const job = jobStore.get(jobId);
  if (!job) return false;

  // Cancel if still running
  if (job.status === 'pending' || job.status === 'processing') {
    await cancelJob(jobId);
  }

  // Clean up files
  try {
    await unlink(job.inputPath).catch(() => {});
    await unlink(job.outputPath).catch(() => {});
  } catch {
    // Ignore cleanup errors
  }

  return jobStore.delete(jobId);
}

export function subscribeToJob(jobId: string, res: import('express').Response): boolean {
  return jobStore.addSubscriber(jobId, res);
}

export function unsubscribeFromJob(jobId: string, res: import('express').Response): boolean {
  return jobStore.removeSubscriber(jobId, res);
}

export function jobToProgressEvent(job: Job): ProgressEvent {
  const memoryUsage = process.memoryUsage();

  return {
    jobId: job.id,
    status: job.status,
    currentStage: job.currentStageName,
    stageIndex: job.currentStageIndex,
    totalStages: job.totalStages,
    bytesRead: job.bytesRead,
    bytesWritten: job.bytesWritten,
    rowsProcessed: job.rowsProcessed,
    rowsFiltered: job.rowsFiltered,
    startedAt: job.startedAt?.toISOString() ?? job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString(),
    completedAt: job.completedAt?.toISOString() ?? null,
    error: job.error,
    memoryUsageMb: Math.round(memoryUsage.heapUsed / 1024 / 1024 * 100) / 100,
  };
}
