import { Request, Response } from 'express';
import { createReadStream, existsSync } from 'node:fs';
import { basename } from 'node:path';
import { getJob } from '../services/job.service.js';
import { getContentType, getFileSize } from '../utils/file.utils.js';

/**
 * Download controller - handles streaming file downloads
 *
 * GET /api/jobs/:jobId/download
 *
 * Returns:
 * - Streams the processed output file
 * - Sets appropriate headers for download
 * - Returns 404 if job not found or output doesn't exist
 * - Returns 409 if job is not completed
 */
export async function downloadFile(req: Request, res: Response): Promise<void> {
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

  // Check if job is completed
  if (job.status !== 'completed') {
    res.status(409).json({
      success: false,
      error: 'Job is not completed yet',
      code: 'JOB_NOT_COMPLETED',
      details: {
        status: job.status,
        message: job.status === 'processing'
          ? 'Job is still processing'
          : job.status === 'pending'
          ? 'Job is pending'
          : job.status === 'failed'
          ? `Job failed: ${job.error}`
          : 'Job was cancelled',
      },
    });
    return;
  }

  // Check if output file exists
  if (!existsSync(job.outputPath)) {
    res.status(404).json({
      success: false,
      error: 'Output file not found',
      code: 'OUTPUT_FILE_NOT_FOUND',
    });
    return;
  }

  try {
    // Get file info
    const fileSize = getFileSize(job.outputPath);
    const fileName = basename(job.outputPath);
    const contentType = getContentType(fileName);

    // Set response headers
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', fileSize);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Cache-Control', 'no-cache');

    // Stream the file
    const fileStream = createReadStream(job.outputPath);

    // Handle stream errors
    fileStream.on('error', (error) => {
      console.error('Error streaming file:', error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: 'Error streaming file',
          code: 'STREAM_ERROR',
        });
      }
    });

    // Pipe file stream to response
    fileStream.pipe(res);

  } catch (error) {
    console.error('Error preparing file download:', error);
    res.status(500).json({
      success: false,
      error: 'Error preparing file download',
      code: 'DOWNLOAD_ERROR',
      details: error instanceof Error ? error.message : String(error),
    });
  }
}
