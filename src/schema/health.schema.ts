export interface HealthyResponse {
  readonly status: "ok";
  readonly timestamp: string;
}

export interface UnhealthyResponse {
  readonly status: "unhealthy";
  readonly reason: string;
  readonly timestamp: string;
}

export interface ErrorResponse {
  readonly status: "error";
  readonly message: string;
}
