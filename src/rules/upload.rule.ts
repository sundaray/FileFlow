/**
 * Upload business Rule
 */

import type { PipelineConfig } from "../types/job.types.js";
// ─────────────────────────────────────────────────────────────
// Validate Upload - Input
// ─────────────────────────────────────────────────────────────

export interface ValidateUploadInput {
  fileName: string | undefined;
  pipelineConfigRaw: string | undefined;
  contentLength: number | undefined;
  maxFileSizeBytes: number;
}

// ─────────────────────────────────────────────────────────────
// Validate Upload - Output
// ─────────────────────────────────────────────────────────────

export type ValidateUploadOutput =
  | {
      _tag: "Success";
      fileName: string;
      pipelineConfig: PipelineConfig;
    }
  | { _tag: "MissingFileName" }
  | { _tag: "MissingPipelineConfig" }
  | { _tag: "InvalidPipelineConfig"; error: string }
  | { _tag: "InvalidPipelineStructure"; error: string }
  | { _tag: "FileTooLarge"; maxBytes: number; actualBytes: number };

// ─────────────────────────────────────────────────────────────
// Validate Upload - Rule
// ─────────────────────────────────────────────────────────────

export function validateUpload(
  input: ValidateUploadInput
): ValidateUploadOutput {
  const { fileName, pipelineConfigRaw, contentLength, maxFileSizeBytes } =
    input;
  if (fileName === undefined || fileName.trim() === "") {
    return { _tag: "MissingFileName" };
  }

  if (pipelineConfigRaw === undefined || pipelineConfigRaw.trim() === "") {
    return { _tag: "MissingPipelineConfig" };
  }

  let pipelineConfig: unknown;
  try {
    pipelineConfig = JSON.parse(pipelineConfigRaw);
  } catch (error) {
    return {
      _tag: "InvalidPipelineConfig",
      error: error instanceof Error ? error.message : "Invalid JSON",
    };
  }

  const structureError = validatePipelineStructure(pipelineConfig);
  if (structureError !== null) {
    return { _tag: "InvalidPipelineStructure", error: structureError };
  }

  if (contentLength !== undefined && contentLength > maxFileSizeBytes) {
    return {
      _tag: "FileTooLarge",
      maxBytes: maxFileSizeBytes,
      actualBytes: contentLength,
    };
  }

  return {
    _tag: "Success",
    fileName: fileName.trim(),
    pipelineConfig: pipelineConfig as PipelineConfig,
  };
}

// ─────────────────────────────────────────────────────────────
// Validate Pipeline Structure
// ─────────────────────────────────────────────────────────────

function validatePipelineStructure(config: unknown): string | null {
  if (typeof config !== "object" || config === null) {
    return "Pipeline config must be an object";
  }

  const obj = config as Record<string, unknown>;

  if (!Array.isArray(obj.stages)) {
    return "Pipeline config must have a 'stages' array";
  }

  for (let i = 0; i < obj.stages.length; i++) {
    const stage = obj.stages[i];
    const error = validateStageConfig(stage, i);
    if (error !== null) {
      return error;
    }
  }

  return null;
}

function validateStageConfig(stage: unknown, index: number): string | null {
  if (typeof stage !== "object" || stage === null) {
    return `Stage ${index} must be an object`;
  }

  const obj = stage as Record<string, unknown>;

  if (typeof obj.id !== "string") {
    return `Stage ${index} must have a string 'id'`;
  }

  if (typeof obj.type !== "string") {
    return `Stage ${index} must have a string 'type'`;
  }

  if (typeof obj.enabled !== "boolean") {
    return `Stage ${index} must have a boolean 'enabled'`;
  }

  if (typeof obj.options !== "object" || obj.options === null) {
    return `Stage ${index} must have an 'options' object`;
  }

  return null;
}

// ─────────────────────────────────────────────────────────────
// Create Job Params - Input
// ─────────────────────────────────────────────────────────────

export interface CreateJobParamsInput {
  readonly jobId: string;
  readonly filename: string;
  readonly pipelineConfig: PipelineConfig;
  readonly uploadsDir: string;
  readonly outputsDir: string;
}

// ─────────────────────────────────────────────────────────────
// Create Job Params - Output
// ─────────────────────────────────────────────────────────────

export interface CreateJobParamsOutput {
  readonly id: string;
  readonly filename: string;
  readonly safeFilename: string;
  readonly inputPath: string;
  readonly outputPath: string;
  readonly pipelineConfig: PipelineConfig;
  readonly totalStages: number;
}

// ─────────────────────────────────────────────────────────────
// Create Job Params - Pure Transformation
// ─────────────────────────────────────────────────────────────

export function createJobParams(
  input: CreateJobParamsInput
): CreateJobParamsOutput {
  const { jobId, filename, pipelineConfig, uploadsDir, outputsDir } = input;

  const safeFilename = filename.replace(/[^a-zA-Z0-9.-]/g, "_");

  const hasCompress = pipelineConfig.stages.some(
    (s) => s.enabled && s.type === "compress"
  );

  const compressStage = pipelineConfig.stages.find(
    (s) => s.enabled && s.type === "compress"
  );

  const compressAlgo =
    compressStage?.type === "compress"
      ? (compressStage.options as { algorithm?: string }).algorithm ?? "gzip"
      : "gzip";

  const outputExtension = hasCompress
    ? compressAlgo === "gzip"
      ? ".gz"
      : compressAlgo === "brotli"
      ? ".br"
      : ".deflate"
    : "";

  const inputPath = `${uploadsDir}/${jobId}-${safeFilename}`;
  const outputPath = `${outputsDir}/${jobId}-processed${outputExtension}`;
  const totalStages = pipelineConfig.stages.filter((s) => s.enabled).length;

  return {
    id: jobId,
    filename,
    safeFilename,
    inputPath,
    outputPath,
    pipelineConfig,
    totalStages,
  };
}
