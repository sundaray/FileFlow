import { Transform } from 'node:stream';
import type { JsonParserStageConfig } from '../../types/pipeline.types.js';

/**
 * JSON Parser Transform
 * Parses JSON lines (newline-delimited JSON) into objects.
 * Each line should contain a valid JSON object.
 */
export class JsonParserTransform extends Transform {
  private buffer = '';

  constructor(config: JsonParserStageConfig) {
    super({ objectMode: true });
  }

  _transform(
    chunk: Buffer | string,
    encoding: BufferEncoding,
    callback: (error?: Error | null) => void
  ): void {
    this.buffer += chunk.toString();
    const lines = this.buffer.split('\n');

    // Keep the last incomplete line in the buffer
    this.buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine) {
        try {
          const obj = JSON.parse(trimmedLine);
          this.push(obj);
        } catch (err) {
          callback(new Error(`Invalid JSON line: ${trimmedLine}`));
          return;
        }
      }
    }

    callback();
  }

  _flush(callback: (error?: Error | null) => void): void {
    // Process any remaining data in buffer
    if (this.buffer.trim()) {
      try {
        const obj = JSON.parse(this.buffer.trim());
        this.push(obj);
      } catch (err) {
        callback(new Error(`Invalid JSON line: ${this.buffer}`));
        return;
      }
    }
    callback();
  }
}
