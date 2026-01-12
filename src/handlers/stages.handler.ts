import { Effect } from "effect";
import {
  getStages,
  type StageCategory,
  type GetStagesDecision,
} from "../rules/stages.rule.js";

export interface GetStagesInput {
  readonly category?: StageCategory;
}

export interface GetStagesOutput {
  readonly decision: GetStagesDecision;
}

export function handleGetStages(
  input: GetStagesInput
): Effect.Effect<GetStagesOutput> {
  return Effect.gen(function* () {
    const decision = getStages({ category: input.category });

    return { decision };
  });
}
