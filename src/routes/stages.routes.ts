import { Router } from 'express';
import { listStages } from '../controllers/index.js';

/**
 * Stages routes
 *
 * GET /api/stages - List all available pipeline stage definitions
 *
 * Response: Array of stage definitions
 * - Each stage includes type, name, description, category, default options, and schema
 * - Used by frontend to build pipeline configuration UI
 */
const router = Router();

router.get('/', listStages);

export default router;
