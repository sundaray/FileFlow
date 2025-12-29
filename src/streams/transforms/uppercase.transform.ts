import { Transform } from 'node:stream';
import type { UppercaseStageConfig } from '../../types/pipeline.types.js';

/**
 * Uppercase Transform
 * Converts specified string fields to uppercase.
 * Use '*' to convert all string fields.
 */
export class UppercaseTransform extends Transform {
  private fields: string[] | '*';

  constructor(config: UppercaseStageConfig) {
    super({ objectMode: true });
    this.fields = config.options.fields;
  }

  _transform(
    chunk: Record<string, unknown>,
    encoding: BufferEncoding,
    callback: (error?: Error | null, data?: Record<string, unknown>) => void
  ): void {
    const result = { ...chunk };

    if (this.fields === '*') {
      // Convert all string fields
      for (const key in result) {
        if (typeof result[key] === 'string') {
          result[key] = (result[key] as string).toUpperCase();
        }
      }
    } else {
      // Convert only specified fields
      for (const field of this.fields) {
        if (field in result && typeof result[field] === 'string') {
          result[field] = (result[field] as string).toUpperCase();
        }
      }
    }

    callback(null, result);
  }
}
