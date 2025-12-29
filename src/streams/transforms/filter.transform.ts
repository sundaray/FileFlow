import { Transform } from 'node:stream';
import type { FilterStageConfig } from '../../types/pipeline.types.js';

/**
 * Filter Transform
 * Filters objects based on a field condition.
 * Only objects that pass the filter condition are passed through.
 */
export class FilterTransform extends Transform {
  private field: string;
  private operator: FilterStageConfig['options']['operator'];
  private value: string | number;
  private filteredCount = 0;

  constructor(config: FilterStageConfig) {
    super({ objectMode: true });
    this.field = config.options.field;
    this.operator = config.options.operator;
    this.value = config.options.value;
  }

  getFilteredCount(): number {
    return this.filteredCount;
  }

  _transform(
    chunk: Record<string, unknown>,
    encoding: BufferEncoding,
    callback: (error?: Error | null, data?: Record<string, unknown>) => void
  ): void {
    const fieldValue = chunk[this.field];

    if (this.shouldPassThrough(fieldValue)) {
      callback(null, chunk);
    } else {
      this.filteredCount++;
      callback(); // Skip this chunk
    }
  }

  private shouldPassThrough(fieldValue: unknown): boolean {
    switch (this.operator) {
      case 'equals':
        return fieldValue === this.value;

      case 'not-equals':
        return fieldValue !== this.value;

      case 'contains':
        if (typeof fieldValue === 'string' && typeof this.value === 'string') {
          return fieldValue.includes(this.value);
        }
        return false;

      case 'greater-than':
        if (typeof fieldValue === 'number' && typeof this.value === 'number') {
          return fieldValue > this.value;
        }
        return false;

      case 'less-than':
        if (typeof fieldValue === 'number' && typeof this.value === 'number') {
          return fieldValue < this.value;
        }
        return false;

      case 'regex':
        if (typeof fieldValue === 'string' && typeof this.value === 'string') {
          try {
            const regex = new RegExp(this.value);
            return regex.test(fieldValue);
          } catch {
            return false;
          }
        }
        return false;

      default:
        return false;
    }
  }
}
