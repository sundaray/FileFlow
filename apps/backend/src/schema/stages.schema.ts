// ─────────────────────────────────────────────────────────────
// Stage Category
// ─────────────────────────────────────────────────────────────

export type StageCategory = "parser" | "transform" | "filter" | "output";

// ─────────────────────────────────────────────────────────────
// Option Schema
// ─────────────────────────────────────────────────────────────

export interface OptionProperty {
  readonly type: string;
  readonly description: string;
  readonly default?: unknown;
  readonly enum?: ReadonlyArray<string>;
}

export interface OptionSchema {
  readonly type: "object";
  readonly properties: Record<string, OptionProperty>;
  readonly required: ReadonlyArray<string>;
}

// ─────────────────────────────────────────────────────────────
// Stage Definition
// ─────────────────────────────────────────────────────────────

export interface StageDefinition {
  readonly type: string;
  readonly name: string;
  readonly description: string;
  readonly category: StageCategory;
  readonly defaultOptions: Record<string, unknown>;
  readonly optionsSchema: OptionSchema;
}

// ─────────────────────────────────────────────────────────────
// Response
// ─────────────────────────────────────────────────────────────

export interface GetStagesSuccess {
  readonly status: "ok";
  readonly stages: ReadonlyArray<StageDefinition>;
}

export interface GetStagesError {
  readonly status: "error";
  readonly message: string;
}
