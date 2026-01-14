// ─────────────────────────────────────────────────────────────
// UPLOAD SUCCESS
// ─────────────────────────────────────────────────────────────
export interface UploadSuccess {
  status: "ok";
  jobid: string;
  message: string;
}

// ─────────────────────────────────────────────────────────────
// UPLOAD ERRORS
// ─────────────────────────────────────────────────────────────

export interface UploadMissingFilenameError {
  status: "error";
  code: "MISSING_FILENAME";
  message: string;
}

export interface UploadMissingPipelineConfigError {
  status: "error";
  code: "MISSING_PIPELINE_CONFIG";
  message: string;
}

export interface UploadInvalidPipelineConfigError {
  status: "error";
  code: "INVLID_PIPELINE_CONFIG";
  message: string;
}

export interface UploadInvalidPipelineStructureError {
  status: "error";
  code: "INVLID_PIPELINE_STRUCTURE";
  message: string;
}

export interface UploadFileTooLargeError {
  status: "error";
  code: "FILE_TOO_LARGE";
  message: string;
  maxBytes: number;
}

export interface UploadStreamError {
  status: "error";
  code: "UPLOAD_STREAM_ERROR";
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
