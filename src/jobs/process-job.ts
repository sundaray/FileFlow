import { createReadStream, createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import { EventEmitter } from "node:events";
import { buildPipeline } from "../streams/pipeline-builder.js";
import { ProgressTrackerStream } from "../streams/progress-tracker.stream.js";
import { ensureDirectoryExists } from "../utils/file.utils.js";
import {
  markJobStarted,
  markJobCompleted,
  markJobFailed,
  updateJobProgress,
  getJob,
} from "../services/job-store.service.js";
import type { Job } from "./job.types.js";

/**
 * Process a job by running the file through the configured pipeline
 * @param jobId - The job ID to process
 */
export async function processJob(jobId: string): Promise<void> {
  const job = getJob(jobId);
  if (!job) {
    throw new Error(`Job ${jobId} not found`);
  }

  try {
    // Mark job as started
    markJobStarted(jobId);

    // Ensure output directory exists
    await ensureDirectoryExists(job.outputPath);

    // Create event emitter for progress tracking
    const progressEmitter = new EventEmitter();

    // Set up progress event listener
    let lastUpdate = Date.now();
    const UPDATE_INTERVAL_MS = 100; // Update progress every 100ms at most

    progressEmitter.on("progress", (event: { bytesProcessed: number }) => {
      const now = Date.now();
      if (now - lastUpdate >= UPDATE_INTERVAL_MS) {
        updateJobProgress(jobId, {
          bytesRead: event.bytesProcessed,
        });
        lastUpdate = now;
      }
    });

    // Build the pipeline
    const {
      pipeline: transformPipeline,
      stages,
      filterTransforms,
    } = buildPipeline(job.pipelineConfig);

    // Create streams
    const inputStream = createReadStream(job.inputPath);
    const progressTracker = new ProgressTrackerStream(progressEmitter);
    const outputStream = createWriteStream(job.outputPath);

    // Store active streams in job for potential cancellation
    const updatedJob = getJob(jobId);
    if (updatedJob) {
      updatedJob.activeStreams = [
        inputStream,
        progressTracker,
        transformPipeline,
        outputStream,
      ];
    }

    // Update stage names as pipeline progresses
    for (let i = 0; i < stages.length; i++) {
      const stage = stages[i];
      updateJobProgress(jobId, {
        currentStageIndex: i,
        currentStageName: stage.type,
      });
    }

    // Run the pipeline: input -> progress tracker -> transform pipeline -> output
    await pipeline(
      inputStream,
      progressTracker,
      transformPipeline,
      outputStream
    );

    // Calculate rows filtered
    let rowsFiltered = 0;
    for (const filterTransform of filterTransforms) {
      rowsFiltered += filterTransform.getFilteredCount();
    }

    // Get final bytes written from output file
    const { statSync } = await import("node:fs");
    const outputStats = statSync(job.outputPath);

    // Mark job as completed
    markJobCompleted(jobId, outputStats.size);

    // Update final metrics
    updateJobProgress(jobId, {
      bytesRead: progressTracker.getBytesProcessed(),
      rowsFiltered,
    });
  } catch (error) {
    // Mark job as failed
    const errorMessage = error instanceof Error ? error.message : String(error);
    markJobFailed(jobId, errorMessage);

    // Clean up streams on error
    const currentJob = getJob(jobId);
    if (currentJob) {
      for (const stream of currentJob.activeStreams) {
        stream.destroy();
      }
      currentJob.activeStreams = [];
    }
  }
}
