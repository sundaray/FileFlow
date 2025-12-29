import { Transform } from 'node:stream';
import type { JsonStringifyStageConfig } from '../../types/pipeline.types.js';

/**
 * JSON Stringify Transform
 * Converts objects back to JSON lines (newline-delimited JSON).
 * Each object is stringified and followed by a newline character.
 */
export class JsonStringifyTransform extends Transform {
  private pretty: boolean;

  constructor(config: JsonStringifyStageConfig) {
    super({ objectMode: true, readableObjectMode: false });
    this.pretty = config.options.pretty;
  }

  _transform(
    chunk: Record<string, unknown>,
    encoding: BufferEncoding,
    callback: (error?: Error | null, data?: string) => void
  ): void {
    try {
      const json = this.pretty
        ? JSON.stringify(chunk, null, 2)
        : JSON.stringify(chunk);

      callback(null, json + '\n');
    } catch (err) {
      callback(err as Error);
    }
  }
}
