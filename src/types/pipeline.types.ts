// Supported stage types
export type StageType =
  | 'csv-parser'
  | 'json-parser'
  | 'filter'
  | 'field-mapper'
  | 'uppercase'
  | 'lowercase'
  | 'redact-pii'
  | 'json-stringify'
  | 'compress';

// Base stage configuration
interface BaseStageConfig {
  id: string;        // Unique ID for this stage instance
  type: StageType;
  enabled: boolean;
}

// CSV Parser stage
export interface CsvParserStageConfig extends BaseStageConfig {
  type: 'csv-parser';
  options: {
    delimiter: string;       // Default: ','
    hasHeaders: boolean;     // Default: true
    skipEmptyLines: boolean; // Default: true
  };
}

// JSON Parser stage (for JSON lines format)
export interface JsonParserStageConfig extends BaseStageConfig {
  type: 'json-parser';
  options: Record<string, never>; // No options currently
}

// Filter stage
export interface FilterStageConfig extends BaseStageConfig {
  type: 'filter';
  options: {
    field: string;                              // Field to check
    operator: 'equals' | 'not-equals' | 'contains' | 'greater-than' | 'less-than' | 'regex';
    value: string | number;
  };
}

// Field mapper stage
export interface FieldMapperStageConfig extends BaseStageConfig {
  type: 'field-mapper';
  options: {
    mappings: Array<{
      from: string;      // Original field name
      to: string;        // New field name
      transform?: 'none' | 'uppercase' | 'lowercase' | 'trim';
    }>;
    dropUnmapped: boolean;  // If true, remove fields not in mappings
  };
}

// Uppercase stage
export interface UppercaseStageConfig extends BaseStageConfig {
  type: 'uppercase';
  options: {
    fields: string[] | '*';  // '*' means all string fields
  };
}

// Lowercase stage
export interface LowercaseStageConfig extends BaseStageConfig {
  type: 'lowercase';
  options: {
    fields: string[] | '*';
  };
}

// Redact PII stage
export interface RedactPiiStageConfig extends BaseStageConfig {
  type: 'redact-pii';
  options: {
    redactEmails: boolean;
    redactPhones: boolean;
    redactSSN: boolean;
    redactCreditCards: boolean;
    maskChar: string;        // Default: '*'
    visibleChars: number;    // How many chars to leave visible. Default: 4
  };
}

// JSON stringify stage (objects back to JSON lines)
export interface JsonStringifyStageConfig extends BaseStageConfig {
  type: 'json-stringify';
  options: {
    pretty: boolean;  // Pretty print JSON
  };
}

// Compress stage
export interface CompressStageConfig extends BaseStageConfig {
  type: 'compress';
  options: {
    algorithm: 'gzip' | 'brotli' | 'deflate';
    level: number;  // Compression level (1-9 for gzip, 1-11 for brotli)
  };
}

// Union of all stage configs
export type StageConfig =
  | CsvParserStageConfig
  | JsonParserStageConfig
  | FilterStageConfig
  | FieldMapperStageConfig
  | UppercaseStageConfig
  | LowercaseStageConfig
  | RedactPiiStageConfig
  | JsonStringifyStageConfig
  | CompressStageConfig;

// Complete pipeline configuration
export interface PipelineConfig {
  stages: StageConfig[];
}

// Stage definition for GET /api/stages endpoint
export interface StageDefinition {
  type: StageType;
  name: string;
  description: string;
  category: 'parser' | 'transform' | 'filter' | 'output';
  defaultOptions: Record<string, unknown>;
  optionsSchema: {
    type: 'object';
    properties: Record<string, {
      type: string;
      description: string;
      default?: unknown;
      enum?: string[];
    }>;
    required: string[];
  };
}
