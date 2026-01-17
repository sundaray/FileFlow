import { Effect } from "effect";
import { checkHealth, type HealthDecision } from "../rules/health.rule.js";

export interface HealthCheckResult {
  decision: HealthDecision;
  timestamp: string;
}

export function handleHealthCheck(): Effect.Effect<HealthCheckResult> {
  return Effect.gen(function* () {
    const isJobStoreOperational = true;

    const decision = checkHealth({ isJobStoreOperational: true });

    const timestamp = new Date().toISOString();

    return { decision, timestamp };
  });
}
