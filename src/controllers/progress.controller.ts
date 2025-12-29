import { Request, Response } from 'express';
import { getJob, subscribeToJob, unsubscribeFromJob, jobToProgressEvent } from '../services/job.service.js';
import { initializeSSE, sendSSEComment } from '../utils/sse.utils.js';

/**
 * Progress controller - handles Server-Sent Events (SSE) for job progress streaming
 *
 * GET /api/jobs/:jobId/progress
 *
 * Returns:
 * - SSE stream with real-time progress updates
 * - Sends initial job state immediately
 * - Sends updates as job progresses
 * - Closes connection when job completes/fails/cancels
 */
export async function streamProgress(req: Request, res: Response): Promise<void> {
  const { jobId } = req.params;

  // Get job
  const job = getJob(jobId);
  if (!job) {
    res.status(404).json({
      success: false,
      error: `Job ${jobId} not found`,
      code: 'JOB_NOT_FOUND',
    });
    return;
  }

  // Initialize SSE connection
  initializeSSE(res);

  // Send initial progress event
  const initialEvent = jobToProgressEvent(job);
  res.write(`data: ${JSON.stringify(initialEvent)}\n\n`);

  // Subscribe to job updates
  const subscribed = subscribeToJob(jobId, res);

  if (!subscribed) {
    res.write(`data: ${JSON.stringify({ error: 'Failed to subscribe to job updates' })}\n\n`);
    res.end();
    return;
  }

  // Send keepalive comments every 15 seconds to prevent timeout
  const keepaliveInterval = setInterval(() => {
    try {
      sendSSEComment(res, 'keepalive');
    } catch (error) {
      // Client disconnected
      clearInterval(keepaliveInterval);
    }
  }, 15000);

  // Handle client disconnect
  req.on('close', () => {
    clearInterval(keepaliveInterval);
    unsubscribeFromJob(jobId, res);
  });

  // Handle errors
  req.on('error', () => {
    clearInterval(keepaliveInterval);
    unsubscribeFromJob(jobId, res);
  });
}
