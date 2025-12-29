import { Router, Request, Response } from 'express';
import uploadRoutes from './upload.routes.js';
import progressRoutes from './progress.routes.js';
import downloadRoutes from './download.routes.js';
import jobsRoutes from './jobs.routes.js';
import stagesRoutes from './stages.routes.js';

/**
 * API Routes Aggregator
 *
 * Combines all route modules and mounts them under /api
 * Provides:
 * - GET /api/health - Health check endpoint
 * - POST /api/upload - File upload
 * - GET /api/progress/:jobId - Job progress (SSE)
 * - GET /api/download/:jobId - File download
 * - GET /api/jobs - List all jobs
 * - GET /api/jobs/:jobId - Get job details
 * - DELETE /api/jobs/:jobId - Delete job
 * - POST /api/jobs/:jobId/cancel - Cancel job
 * - GET /api/stages - List available stages
 */
const router = Router();

/**
 * Health check endpoint
 * Returns the API status and current timestamp
 */
router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

/**
 * Mount all route modules under /api
 */
router.use('/upload', uploadRoutes);
router.use('/progress', progressRoutes);
router.use('/download', downloadRoutes);
router.use('/jobs', jobsRoutes);
router.use('/stages', stagesRoutes);

export default router;
