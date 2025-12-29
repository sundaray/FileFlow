import { Request, Response } from 'express';
import { getStageDefinitions } from '../streams/pipeline-builder.js';
import type { ListStagesResponse } from '../types/api.types.js';

/**
 * List available pipeline stages
 *
 * GET /api/stages
 *
 * Returns:
 * - Array of all available pipeline stage definitions
 * - Each stage includes type, name, description, category, default options, and schema
 * - Used by frontend to build pipeline configuration UI
 */
export async function listStages(req: Request, res: Response): Promise<void> {
  try {
    const stages = getStageDefinitions();

    const response: ListStagesResponse = {
      success: true,
      stages,
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to list stages',
      code: 'LIST_STAGES_ERROR',
      details: error instanceof Error ? error.message : String(error),
    });
  }
}
