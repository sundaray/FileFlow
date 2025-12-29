import { Router } from 'express';
import { streamProgress } from '../controllers/index.js';

/**
 * Progress routes
 *
 * GET /api/progress/:jobId - Stream job progress via Server-Sent Events (SSE)
 *
 * Path parameters:
 * - jobId: Unique job identifier
 *
 * Response: SSE stream with real-time progress updates
 * - Sends initial job state immediately
 * - Sends updates as job progresses
 * - Closes connection when job completes/fails/cancels
 */
const router = Router();

router.get('/:jobId', streamProgress);

export default router;
