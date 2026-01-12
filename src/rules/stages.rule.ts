/**
 * Stages Business Rule
 *
 * Pure data + logic for available pipeline stages.
 * No I/O, no frameworks, no dependencies.
 */

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export type StageCategory = "parser" | "transform" | "filter" | "output";

export interface OptionSchema {
  readonly type: "object";
  readonly properties: Record<
    string,
    {
      readonly type: string;
      readonly description: string;
      readonly default?: unknown;
      readonly enum?: ReadonlyArray<string>;
    }
  >;
  readonly required: ReadonlyArray<string>;
}

export interface StageDefinition {
  readonly type: string;
  readonly name: string;
  readonly description: string;
  readonly category: StageCategory;
  readonly defaultOptions: Record<string, unknown>;
  readonly optionsSchema: OptionSchema;
}

// ─────────────────────────────────────────────────────────────
// Input
// ─────────────────────────────────────────────────────────────

export interface GetStagesInput {
  readonly category?: StageCategory;
}

// ─────────────────────────────────────────────────────────────
// Output
// ─────────────────────────────────────────────────────────────

export interface GetStagesDecision {
  readonly _tag: "Success";
  readonly stages: ReadonlyArray<StageDefinition>;
}

// ─────────────────────────────────────────────────────────────
// Stage Definitions
// ─────────────────────────────────────────────────────────────

const ALL_STAGES: ReadonlyArray<StageDefinition> = [
  // Parser
  {
    type: "csv-parser",
    name: "CSV Parser",
    description: "Parses CSV data into objects",
    category: "parser",
    defaultOptions: {
      delimiter: ",",
      hasHeaders: true,
      skipEmptyLines: true,
    },
    optionsSchema: {
      type: "object",
      properties: {
        delimiter: {
          type: "string",
          description: "Column delimiter character",
          default: ",",
        },
        hasHeaders: {
          type: "boolean",
          description: "Whether the first row contains column headers",
          default: true,
        },
        skipEmptyLines: {
          type: "boolean",
          description: "Skip empty lines in the CSV",
          default: true,
        },
      },
      required: ["delimiter", "hasHeaders", "skipEmptyLines"],
    },
  },

  // Filter
  {
    type: "filter",
    name: "Filter",
    description: "Filters objects based on field conditions",
    category: "filter",
    defaultOptions: {
      field: "",
      operator: "equals",
      value: "",
    },
    optionsSchema: {
      type: "object",
      properties: {
        field: {
          type: "string",
          description: "Field name to check",
        },
        operator: {
          type: "string",
          description: "Comparison operator",
          enum: [
            "equals",
            "not-equals",
            "contains",
            "greater-than",
            "less-than",
          ],
        },
        value: {
          type: "string",
          description: "Value to compare against",
        },
      },
      required: ["field", "operator", "value"],
    },
  },

  // 3. Transform: Uppercase
  {
    type: "uppercase",
    name: "Uppercase",
    description: "Converts string fields to uppercase",
    category: "transform",
    defaultOptions: {
      fields: "*",
    },
    optionsSchema: {
      type: "object",
      properties: {
        fields: {
          type: "string",
          description:
            'Fields to convert (array of field names or "*" for all)',
          default: "*",
        },
      },
      required: ["fields"],
    },
  },

  // Output: JSON
  {
    type: "json-stringify",
    name: "JSON Stringify",
    description: "Converts objects to JSON lines (newline-delimited JSON)",
    category: "output",
    defaultOptions: {
      pretty: false,
    },
    optionsSchema: {
      type: "object",
      properties: {
        pretty: {
          type: "boolean",
          description: "Pretty-print JSON output",
          default: false,
        },
      },
      required: ["pretty"],
    },
  },

  // Output: Gzip
  {
    type: "compress",
    name: "Gzip Compress",
    description: "Compresses output data using Gzip",
    category: "output",
    defaultOptions: {
      level: 6,
    },
    optionsSchema: {
      type: "object",
      properties: {
        level: {
          type: "number",
          description: "Compression level (1-9)",
          default: 6,
        },
      },
      required: ["level"],
    },
  },
];

// ─────────────────────────────────────────────────────────────
// The Rule
// ─────────────────────────────────────────────────────────────

export function getStages(input: GetStagesInput): GetStagesDecision {
  let stages = ALL_STAGES;

  if (input.category !== undefined) {
    stages = stages.filter((stage) => stage.category === input.category);
  }

  return {
    _tag: "Success",
    stages,
  };
}
