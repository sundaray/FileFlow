import { Router } from 'express';
import { listJobs, getJobDetails, deleteJob, cancelJob } from '../controllers/index.js';

/**
 * Jobs routes
 *
 * GET /api/jobs - List all jobs with summaries
 * GET /api/jobs/:jobId - Get complete job details
 * DELETE /api/jobs/:jobId - Delete a job and clean up files
 * POST /api/jobs/:jobId/cancel - Cancel a pending or processing job
 *
 * Path parameters:
 * - jobId: Unique job identifier
 */
const router = Router();

router.get('/', listJobs);
router.get('/:jobId', getJobDetails);
router.delete('/:jobId', deleteJob);
router.post('/:jobId/cancel', cancelJob);

export default router;
