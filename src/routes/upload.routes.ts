import { Router } from 'express';
import { uploadFile } from '../controllers/index.js';

/**
 * Upload routes
 *
 * POST /api/upload - Stream file upload with pipeline configuration
 *
 * Headers:
 * - x-filename: Original filename
 * - x-pipeline-config: JSON stringified PipelineConfig
 *
 * Body: Raw file stream
 *
 * Response: 202 Accepted with jobId
 */
const router = Router();

router.post('/', uploadFile);

export default router;
