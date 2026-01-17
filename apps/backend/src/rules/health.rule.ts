export interface HealthCheckInput {
  readonly isJobStoreOperational: boolean;
}

export type HealthDecision =
  | { _tag: "Healthy" }
  | { _tag: "Unhealthy"; readonly reason: string };

export function checkHealth(input: HealthCheckInput): HealthDecision {
  if (!input.isJobStoreOperational) {
    return { _tag: "Unhealthy", reason: "Job store is not operational" };
  }
  return { _tag: "Healthy" };
}
