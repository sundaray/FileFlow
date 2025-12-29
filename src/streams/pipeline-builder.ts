import { Duplex, Transform, PassThrough } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import type {
  PipelineConfig,
  StageConfig,
  StageDefinition,
  StageType,
} from '../types/pipeline.types.js';

// Import all transform classes
import { CsvParserTransform } from './transforms/csv-parser.transform.js';
import { JsonParserTransform } from './transforms/json-parser.transform.js';
import { FilterTransform } from './transforms/filter.transform.js';
import { FieldMapperTransform } from './transforms/field-mapper.transform.js';
import { UppercaseTransform } from './transforms/uppercase.transform.js';
import { LowercaseTransform } from './transforms/lowercase.transform.js';
import { RedactPiiTransform } from './transforms/redact-pii.transform.js';
import { JsonStringifyTransform } from './transforms/json-stringify.transform.js';
import { CompressTransform } from './transforms/compress.transform.js';

/**
 * Result of building a pipeline
 */
export interface PipelineBuildResult {
  pipeline: Duplex;
  stages: StageConfig[];
  filterTransforms: FilterTransform[];
}

/**
 * Builds a composed pipeline from a configuration
 * @param config Pipeline configuration with stages
 * @returns PipelineBuildResult containing the composed pipeline and metadata
 */
export function buildPipeline(config: PipelineConfig): PipelineBuildResult {
  const enabledStages = config.stages.filter((stage) => stage.enabled);
  const transforms: Transform[] = [];
  const filterTransforms: FilterTransform[] = [];

  for (const stage of enabledStages) {
    const transform = createTransform(stage);
    transforms.push(transform);

    // Track filter transforms separately for metrics
    if (stage.type === 'filter') {
      filterTransforms.push(transform as FilterTransform);
    }
  }

  // Manually compose transforms by piping them together
  // Create a Duplex stream that wraps the pipeline
  const first = transforms[0];
  const last = transforms[transforms.length - 1];

  // Chain all transforms together
  for (let i = 0; i < transforms.length - 1; i++) {
    transforms[i].pipe(transforms[i + 1]);
  }

  // Create a Duplex that exposes the first transform's writable side
  // and the last transform's readable side
  const composedPipeline = new Duplex({
    objectMode: false,
    write(chunk, encoding, callback) {
      return first.write(chunk, encoding, callback);
    },
    read(size) {
      return last.read(size);
    },
    final(callback) {
      first.end(callback);
    },
  });

  // Pipe last transform's output to the composed pipeline
  last.on('data', (chunk) => composedPipeline.push(chunk));
  last.on('end', () => composedPipeline.push(null));
  last.on('error', (err) => composedPipeline.destroy(err));
  first.on('error', (err) => composedPipeline.destroy(err));

  return {
    pipeline: composedPipeline,
    stages: enabledStages,
    filterTransforms,
  };
}

/**
 * Creates a transform instance based on stage configuration
 * @param stage Stage configuration
 * @returns Transform stream instance
 */
function createTransform(stage: StageConfig): Transform {
  switch (stage.type) {
    case 'csv-parser':
      return new CsvParserTransform(stage);

    case 'json-parser':
      return new JsonParserTransform(stage);

    case 'filter':
      return new FilterTransform(stage);

    case 'field-mapper':
      return new FieldMapperTransform(stage);

    case 'uppercase':
      return new UppercaseTransform(stage);

    case 'lowercase':
      return new LowercaseTransform(stage);

    case 'redact-pii':
      return new RedactPiiTransform(stage);

    case 'json-stringify':
      return new JsonStringifyTransform(stage);

    case 'compress':
      return new CompressTransform(stage);

    default:
      // TypeScript should ensure this never happens
      throw new Error(`Unknown stage type: ${(stage as StageConfig).type}`);
  }
}

/**
 * Returns definitions for all available pipeline stages
 * @returns Array of stage definitions with schemas and defaults
 */
export function getStageDefinitions(): StageDefinition[] {
  return [
    {
      type: 'csv-parser',
      name: 'CSV Parser',
      description: 'Parses CSV data into objects',
      category: 'parser',
      defaultOptions: {
        delimiter: ',',
        hasHeaders: true,
        skipEmptyLines: true,
      },
      optionsSchema: {
        type: 'object',
        properties: {
          delimiter: {
            type: 'string',
            description: 'Column delimiter character',
            default: ',',
          },
          hasHeaders: {
            type: 'boolean',
            description: 'Whether the first row contains column headers',
            default: true,
          },
          skipEmptyLines: {
            type: 'boolean',
            description: 'Skip empty lines in the CSV',
            default: true,
          },
        },
        required: ['delimiter', 'hasHeaders', 'skipEmptyLines'],
      },
    },
    {
      type: 'json-parser',
      name: 'JSON Parser',
      description: 'Parses JSON lines (newline-delimited JSON) into objects',
      category: 'parser',
      defaultOptions: {},
      optionsSchema: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
    {
      type: 'filter',
      name: 'Filter',
      description: 'Filters objects based on field conditions',
      category: 'filter',
      defaultOptions: {
        field: '',
        operator: 'equals',
        value: '',
      },
      optionsSchema: {
        type: 'object',
        properties: {
          field: {
            type: 'string',
            description: 'Field name to check',
          },
          operator: {
            type: 'string',
            description: 'Comparison operator',
            enum: ['equals', 'not-equals', 'contains', 'greater-than', 'less-than', 'regex'],
          },
          value: {
            type: 'string',
            description: 'Value to compare against (string or number)',
          },
        },
        required: ['field', 'operator', 'value'],
      },
    },
    {
      type: 'field-mapper',
      name: 'Field Mapper',
      description: 'Renames and transforms object fields',
      category: 'transform',
      defaultOptions: {
        mappings: [],
        dropUnmapped: false,
      },
      optionsSchema: {
        type: 'object',
        properties: {
          mappings: {
            type: 'array',
            description: 'Array of field mapping definitions',
          },
          dropUnmapped: {
            type: 'boolean',
            description: 'Remove fields not in mappings',
            default: false,
          },
        },
        required: ['mappings', 'dropUnmapped'],
      },
    },
    {
      type: 'uppercase',
      name: 'Uppercase',
      description: 'Converts string fields to uppercase',
      category: 'transform',
      defaultOptions: {
        fields: '*',
      },
      optionsSchema: {
        type: 'object',
        properties: {
          fields: {
            type: 'string',
            description: 'Fields to convert (array of field names or "*" for all)',
            default: '*',
          },
        },
        required: ['fields'],
      },
    },
    {
      type: 'lowercase',
      name: 'Lowercase',
      description: 'Converts string fields to lowercase',
      category: 'transform',
      defaultOptions: {
        fields: '*',
      },
      optionsSchema: {
        type: 'object',
        properties: {
          fields: {
            type: 'string',
            description: 'Fields to convert (array of field names or "*" for all)',
            default: '*',
          },
        },
        required: ['fields'],
      },
    },
    {
      type: 'redact-pii',
      name: 'Redact PII',
      description: 'Detects and masks personally identifiable information',
      category: 'transform',
      defaultOptions: {
        redactEmails: true,
        redactPhones: true,
        redactSSN: true,
        redactCreditCards: true,
        maskChar: '*',
        visibleChars: 4,
      },
      optionsSchema: {
        type: 'object',
        properties: {
          redactEmails: {
            type: 'boolean',
            description: 'Redact email addresses',
            default: true,
          },
          redactPhones: {
            type: 'boolean',
            description: 'Redact phone numbers',
            default: true,
          },
          redactSSN: {
            type: 'boolean',
            description: 'Redact Social Security Numbers',
            default: true,
          },
          redactCreditCards: {
            type: 'boolean',
            description: 'Redact credit card numbers',
            default: true,
          },
          maskChar: {
            type: 'string',
            description: 'Character to use for masking',
            default: '*',
          },
          visibleChars: {
            type: 'number',
            description: 'Number of characters to leave visible',
            default: 4,
          },
        },
        required: [
          'redactEmails',
          'redactPhones',
          'redactSSN',
          'redactCreditCards',
          'maskChar',
          'visibleChars',
        ],
      },
    },
    {
      type: 'json-stringify',
      name: 'JSON Stringify',
      description: 'Converts objects to JSON lines (newline-delimited JSON)',
      category: 'output',
      defaultOptions: {
        pretty: false,
      },
      optionsSchema: {
        type: 'object',
        properties: {
          pretty: {
            type: 'boolean',
            description: 'Pretty-print JSON output',
            default: false,
          },
        },
        required: ['pretty'],
      },
    },
    {
      type: 'compress',
      name: 'Compress',
      description: 'Compresses data using gzip, brotli, or deflate',
      category: 'output',
      defaultOptions: {
        algorithm: 'gzip',
        level: 6,
      },
      optionsSchema: {
        type: 'object',
        properties: {
          algorithm: {
            type: 'string',
            description: 'Compression algorithm',
            enum: ['gzip', 'brotli', 'deflate'],
            default: 'gzip',
          },
          level: {
            type: 'number',
            description: 'Compression level (1-9 for gzip/deflate, 1-11 for brotli)',
            default: 6,
          },
        },
        required: ['algorithm', 'level'],
      },
    },
  ];
}
