import { Request, Response } from 'express';
import {
  getAllJobs,
  getJob,
  deleteJob as deleteJobService,
  cancelJob as cancelJobService,
  jobToProgressEvent,
} from '../services/job.service.js';
import type {
  ListJobsResponse,
  JobDetailsResponse,
  DeleteJobResponse,
  JobSummary,
} from '../types/api.types.js';

/**
 * List all jobs
 *
 * GET /api/jobs
 *
 * Returns:
 * - Array of job summaries with basic info
 */
export async function listJobs(req: Request, res: Response): Promise<void> {
  try {
    const jobs = getAllJobs();

    const jobSummaries: JobSummary[] = jobs.map((job) => ({
      jobId: job.id,
      filename: job.originalFilename,
      status: job.status,
      createdAt: job.createdAt.toISOString(),
      completedAt: job.completedAt?.toISOString() ?? null,
      bytesRead: job.bytesRead,
      bytesWritten: job.bytesWritten,
    }));

    const response: ListJobsResponse = {
      success: true,
      jobs: jobSummaries,
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to list jobs',
      code: 'LIST_JOBS_ERROR',
      details: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Get job details
 *
 * GET /api/jobs/:jobId
 *
 * Returns:
 * - Complete job information including progress, config, and metrics
 */
export async function getJobDetails(req: Request, res: Response): Promise<void> {
  const { jobId } = req.params;

  try {
    const job = getJob(jobId);

    if (!job) {
      res.status(404).json({
        success: false,
        error: `Job ${jobId} not found`,
        code: 'JOB_NOT_FOUND',
      });
      return;
    }

    const progressEvent = jobToProgressEvent(job);

    const response: JobDetailsResponse = {
      success: true,
      job: {
        ...progressEvent,
        filename: job.originalFilename,
        pipelineConfig: job.pipelineConfig,
      },
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get job details',
      code: 'GET_JOB_ERROR',
      details: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Delete a job
 *
 * DELETE /api/jobs/:jobId
 *
 * Returns:
 * - Success message if job was deleted
 * - Cancels job if it's still running
 * - Cleans up input/output files
 */
export async function deleteJob(req: Request, res: Response): Promise<void> {
  const { jobId } = req.params;

  try {
    const deleted = await deleteJobService(jobId);

    if (!deleted) {
      res.status(404).json({
        success: false,
        error: `Job ${jobId} not found`,
        code: 'JOB_NOT_FOUND',
      });
      return;
    }

    const response: DeleteJobResponse = {
      success: true,
      message: 'Job deleted successfully',
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete job',
      code: 'DELETE_JOB_ERROR',
      details: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Cancel a job
 *
 * POST /api/jobs/:jobId/cancel
 *
 * Returns:
 * - Success message if job was cancelled
 * - Error if job cannot be cancelled (already completed/failed/cancelled)
 */
export async function cancelJob(req: Request, res: Response): Promise<void> {
  const { jobId } = req.params;

  try {
    const cancelled = await cancelJobService(jobId);

    if (!cancelled) {
      const job = getJob(jobId);

      if (!job) {
        res.status(404).json({
          success: false,
          error: `Job ${jobId} not found`,
          code: 'JOB_NOT_FOUND',
        });
        return;
      }

      res.status(409).json({
        success: false,
        error: 'Job cannot be cancelled',
        code: 'CANNOT_CANCEL',
        details: {
          status: job.status,
          message: job.status === 'completed'
            ? 'Job is already completed'
            : job.status === 'failed'
            ? 'Job has already failed'
            : 'Job is already cancelled',
        },
      });
      return;
    }

    res.json({
      success: true,
      message: 'Job cancelled successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to cancel job',
      code: 'CANCEL_JOB_ERROR',
      details: error instanceof Error ? error.message : String(error),
    });
  }
}
