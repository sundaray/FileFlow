import { Data } from "effect";
// ─────────────────────────────────────────────────────────────
// Job Errors
// ─────────────────────────────────────────────────────────────

export class JobNotFoundError extends Data.TaggedError("JobNotFoundError")<{
  jobId: string;
}> {}

// ─────────────────────────────────────────────────────────────
// Pipeline Execution Errors
// ─────────────────────────────────────────────────────────────

export class PipelineExecutionError extends Data.TaggedError(
  "PipelineExecutionError"
)<{
  jobId: string;
  cause: unknown;
}> {}

export class FileWriteError extends Data.TaggedError("FileWriteError")<{
  path: string;
  cause: unknown;
}> {}

// ─────────────────────────────────────────────────────────────
// Stage Configuration Errors
// ─────────────────────────────────────────────────────────────

export class UnknownStageTypeError extends Data.TaggedError(
  "UnknownStageTypeError"
)<{
  stageType: string;
  stageId: string;
}> {}

export class InvalidFilterConfigError extends Data.TaggedError(
  "InvalidFilterConfigError"
)<{
  field: string;
  operator: string;
  message: string;
}> {}

export class InvalidFieldsConfigError extends Data.TaggedError(
  "InvalidFieldsConfigError"
)<{
  fields: unknown;
  message: string;
}> {}

export class UnsupportedCompressionAlgorithmError extends Data.TaggedError(
  "UnsupportedCompressionAlgorithmError"
)<{
  algorithm: string;
}> {}

// ─────────────────────────────────────────────────────────────
// Stream Conversion Errors
// ─────────────────────────────────────────────────────────────

export class CsvParseError extends Data.TaggedError("CsvParseError")<{
  cause: unknown;
}> {}

export class StreamConversionError extends Data.TaggedError(
  "StreamConversionError"
)<{
  cause: unknown;
}> {}

// ─────────────────────────────────────────────────────────────
// Error Type Unions
// ─────────────────────────────────────────────────────────────

export type TransformError =
  | UnknownStageTypeError
  | InvalidFilterConfigError
  | InvalidFieldsConfigError
  | UnsupportedCompressionAlgorithmError
  | CsvParseError
  | StreamConversionError;

export type PipelineError =
  | JobNotFoundError
  | PipelineExecutionError
  | TransformError
  | FileWriteError;
