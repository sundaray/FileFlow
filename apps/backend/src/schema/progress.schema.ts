// ─────────────────────────────────────────────────────────────
// PROGRESS ERRORS
// ─────────────────────────────────────────────────────────────

export interface ProgressJobNotFoundError {
  status: "error";
  code: "JOB_NOT_FOUND";
  message: string;
}

export interface ProgressStreamError {
  status: "error";
  code: "STREAM_ERROR";
  message: string;
}

// ─────────────────────────────────────────────────────────────
// SERVER ERRORS
// ─────────────────────────────────────────────────────────────

export interface InternalServerError {
  status: "error";
  code: "INTERNAL_SERVER_ERROR";
  message: string;
}
