import { Request, Response, NextFunction } from 'express';
import { createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { createJob } from '../services/job.service.js';
import { processJob } from '../jobs/process-job.js';
import { ensureDirectoryExists } from '../utils/file.utils.js';
import { config } from '../config/index.js';
import type { UploadResponse } from '../types/api.types.js';
import type { PipelineConfig } from '../types/pipeline.types.js';

/**
 * Upload controller - handles streaming file uploads
 *
 * Expects:
 * - x-filename header: original filename
 * - x-pipeline-config header: JSON stringified PipelineConfig
 * - Request body: raw file stream
 *
 * Process:
 * 1. Parse headers and validate
 * 2. Stream file to disk without buffering
 * 3. Return 202 Accepted with jobId
 * 4. Process file in background
 */
export async function uploadFile(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Extract and validate headers
    const filename = req.headers['x-filename'] as string;
    const pipelineConfigStr = req.headers['x-pipeline-config'] as string;
    const contentLength = req.headers['content-length'];

    if (!filename) {
      res.status(400).json({
        success: false,
        error: 'Missing x-filename header',
        code: 'MISSING_FILENAME',
      });
      return;
    }

    if (!pipelineConfigStr) {
      res.status(400).json({
        success: false,
        error: 'Missing x-pipeline-config header',
        code: 'MISSING_PIPELINE_CONFIG',
      });
      return;
    }

    // Parse pipeline configuration
    let pipelineConfig: PipelineConfig;
    try {
      pipelineConfig = JSON.parse(pipelineConfigStr);
    } catch (error) {
      res.status(400).json({
        success: false,
        error: 'Invalid pipeline configuration JSON',
        code: 'INVALID_PIPELINE_CONFIG',
        details: error instanceof Error ? error.message : String(error),
      });
      return;
    }

    // Validate pipeline config structure
    if (!pipelineConfig.stages || !Array.isArray(pipelineConfig.stages)) {
      res.status(400).json({
        success: false,
        error: 'Pipeline config must have stages array',
        code: 'INVALID_PIPELINE_CONFIG',
      });
      return;
    }

    // Check file size limit
    if (contentLength) {
      const size = parseInt(contentLength, 10);
      if (size > config.maxFileSizeBytes) {
        res.status(413).json({
          success: false,
          error: `File size exceeds maximum allowed size of ${config.maxFileSizeBytes} bytes`,
          code: 'FILE_TOO_LARGE',
        });
        return;
      }
    }

    // Create job record
    const job = createJob(filename, pipelineConfig);

    // Ensure upload directory exists
    await ensureDirectoryExists(job.inputPath);

    // Create write stream for uploaded file
    const fileWriteStream = createWriteStream(job.inputPath);

    // Track upload progress
    let uploadedBytes = 0;
    req.on('data', (chunk: Buffer) => {
      uploadedBytes += chunk.length;

      // Check size limit during streaming
      if (uploadedBytes > config.maxFileSizeBytes) {
        req.pause();
        fileWriteStream.destroy();
        res.status(413).json({
          success: false,
          error: `File size exceeds maximum allowed size of ${config.maxFileSizeBytes} bytes`,
          code: 'FILE_TOO_LARGE',
        });
      }
    });

    // Stream the request body directly to disk
    await pipeline(req, fileWriteStream);

    // Respond immediately with 202 Accepted
    const response: UploadResponse = {
      success: true,
      jobId: job.id,
      message: 'File uploaded successfully, processing started',
    };

    res.status(202).json(response);

    // Process file in background (don't await)
    processJob(job.id).catch((error) => {
      console.error(`Background processing failed for job ${job.id}:`, error);
    });

  } catch (error) {
    // Clean up on error
    next(error);
  }
}
