import { Router } from 'express';
import { downloadFile } from '../controllers/index.js';

/**
 * Download routes
 *
 * GET /api/download/:jobId - Download processed output file
 *
 * Path parameters:
 * - jobId: Unique job identifier
 *
 * Response: Streams the processed output file
 * - Sets appropriate headers for download
 * - Returns 404 if job not found or output doesn't exist
 * - Returns 409 if job is not completed
 */
const router = Router();

router.get('/:jobId', downloadFile);

export default router;
