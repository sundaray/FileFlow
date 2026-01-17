// Main service export
export { PipelineProcessor } from "./pipeline-processor-service.js";

// Error types for consumers who need to handle specific errors
export {
  JobNotFoundError,
  PipelineExecutionError,
  FileWriteError,
  UnknownStageTypeError,
  InvalidFilterConfigError,
  InvalidFieldsConfigError,
  UnsupportedCompressionAlgorithmError,
  CsvParseError,
  StreamConversionError,
  type TransformError,
  type PipelineError,
} from "./errors.js";

// Pipeline building utilities (for advanced usage)
export {
  buildPipelineStages,
  type PipelineStages,
  type ObjectTransform,
  type ByteTransform,
} from "./pipeline-builder.js";

// Pipeline execution (for advanced usage)
export { executePipeline, type PipelineResult } from "./pipeline-executor.js";

// Transform functions (for testing or custom pipelines)
export {
  filterRecords,
  uppercaseRecords,
  lowercaseRecords,
  jsonStringify,
  compressStream,
  parseCsvStream,
  defaultCsvParserOptions,
  type CsvParserOptions,
} from "./transforms/index.js";
