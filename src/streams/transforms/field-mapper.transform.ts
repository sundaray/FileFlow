import { Transform } from 'node:stream';
import type { FieldMapperStageConfig } from '../../types/pipeline.types.js';

/**
 * Field Mapper Transform
 * Renames and transforms fields in objects.
 * Can optionally drop unmapped fields.
 */
export class FieldMapperTransform extends Transform {
  private mappings: FieldMapperStageConfig['options']['mappings'];
  private dropUnmapped: boolean;

  constructor(config: FieldMapperStageConfig) {
    super({ objectMode: true });
    this.mappings = config.options.mappings;
    this.dropUnmapped = config.options.dropUnmapped;
  }

  _transform(
    chunk: Record<string, unknown>,
    encoding: BufferEncoding,
    callback: (error?: Error | null, data?: Record<string, unknown>) => void
  ): void {
    const result: Record<string, unknown> = this.dropUnmapped ? {} : { ...chunk };

    for (const mapping of this.mappings) {
      const { from, to, transform = 'none' } = mapping;

      if (from in chunk) {
        let value = chunk[from];

        // Apply transformation if it's a string
        if (typeof value === 'string') {
          value = this.applyTransform(value, transform);
        }

        result[to] = value;

        // Remove old field if renaming and not dropping unmapped
        if (from !== to && !this.dropUnmapped) {
          delete result[from];
        }
      }
    }

    callback(null, result);
  }

  private applyTransform(
    value: string,
    transform: 'none' | 'uppercase' | 'lowercase' | 'trim'
  ): string {
    switch (transform) {
      case 'uppercase':
        return value.toUpperCase();
      case 'lowercase':
        return value.toLowerCase();
      case 'trim':
        return value.trim();
      case 'none':
      default:
        return value;
    }
  }
}
