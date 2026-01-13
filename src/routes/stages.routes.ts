import { Effect, Exit, Cause } from "effect";
import { Router, Request, Response } from "express";
import { handleGetStages } from "../handlers/stages.handler.js";
import type { StageCategory } from "../rules/stages.rule.js";
import type {
  GetStagesSuccess,
  GetStagesError,
} from "../schema/stages.schema.js";

const router: ReturnType<typeof Router> = Router();

/**
 * GET /api/stages
 *
 * Returns all available pipeline stage definitions.
 * Used by frontend to dynamically build the pipeline configuration UI.
 *
 * Query params:
 *   - category (optional): Filter by stage category (parser, transform, filter, output)
 */
router.get("/", async (req: Request, res: Response) => {
  const categoryParam = req.query.category as string | undefined;
  const category = isValidCategory(categoryParam) ? categoryParam : undefined;

  const exit = await Effect.runPromiseExit(handleGetStages({ category }));

  Exit.match(exit, {
    onFailure: (cause) => {
      console.error("Get stages defect: \n" + Cause.pretty(cause));

      const response: GetStagesError = {
        status: "error",
        message: "Internal server error",
      };

      res.status(500).json(response);
    },

    onSuccess: ({ decision }) => {
      const response: GetStagesSuccess = {
        status: "ok",
        stages: decision.stages,
      };

      res.status(200).json(response);
    },
  });
});

function isValidCategory(
  category: string | undefined
): category is StageCategory {
  return (
    category !== undefined &&
    ["parser", "transform", "filter", "output"].includes(category)
  );
}

export default router;
