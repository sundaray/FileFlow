import type { Job, CreateJobInput } from './job.types.js';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/index.js';

class JobStore {
  private jobs: Map<string, Job> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Start periodic cleanup of old jobs
    this.startCleanup();
  }

  create(input: CreateJobInput): Job {
    const id = uuidv4();
    const now = new Date();

    const job: Job = {
      id,
      filename: input.filename,
      originalFilename: input.filename,
      pipelineConfig: input.pipelineConfig,
      status: 'pending',
      inputPath: input.inputPath,
      outputPath: input.outputPath,
      bytesRead: 0,
      bytesWritten: 0,
      rowsProcessed: 0,
      rowsFiltered: 0,
      currentStageIndex: 0,
      totalStages: input.pipelineConfig.stages.filter(s => s.enabled).length,
      currentStageName: null,
      createdAt: now,
      startedAt: null,
      completedAt: null,
      updatedAt: now,
      error: null,
      activeStreams: [],
      subscribers: new Set(),
    };

    this.jobs.set(id, job);
    return job;
  }

  get(id: string): Job | undefined {
    return this.jobs.get(id);
  }

  getAll(): Job[] {
    return Array.from(this.jobs.values());
  }

  update(id: string, updates: Partial<Job>): Job | undefined {
    const job = this.jobs.get(id);
    if (!job) return undefined;

    Object.assign(job, updates, { updatedAt: new Date() });
    return job;
  }

  delete(id: string): boolean {
    const job = this.jobs.get(id);
    if (!job) return false;

    // Close all subscribers
    for (const subscriber of job.subscribers) {
      subscriber.end();
    }
    job.subscribers.clear();

    // Destroy active streams
    for (const stream of job.activeStreams) {
      stream.destroy();
    }
    job.activeStreams = [];

    return this.jobs.delete(id);
  }

  addSubscriber(id: string, res: import('express').Response): boolean {
    const job = this.jobs.get(id);
    if (!job) return false;

    job.subscribers.add(res);
    return true;
  }

  removeSubscriber(id: string, res: import('express').Response): boolean {
    const job = this.jobs.get(id);
    if (!job) return false;

    job.subscribers.delete(res);
    return true;
  }

  notifySubscribers(id: string, event: import('../types/events.types.js').ProgressEvent): void {
    const job = this.jobs.get(id);
    if (!job) return;

    const data = `data: ${JSON.stringify(event)}\n\n`;

    for (const subscriber of job.subscribers) {
      subscriber.write(data);
    }
  }

  private startCleanup(): void {
    // Clean up old completed/failed jobs every 10 minutes
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();

      for (const [id, job] of this.jobs) {
        if (
          (job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') &&
          job.completedAt &&
          now - job.completedAt.getTime() > config.jobRetentionMs
        ) {
          this.delete(id);
        }
      }
    }, 10 * 60 * 1000);
  }

  shutdown(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    // Clean up all jobs
    for (const id of this.jobs.keys()) {
      this.delete(id);
    }
  }
}

// Singleton instance
export const jobStore = new JobStore();
