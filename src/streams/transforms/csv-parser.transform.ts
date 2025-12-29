import { Transform } from 'node:stream';
import { parse } from 'csv-parse';
import type { CsvParserStageConfig } from '../../types/pipeline.types.js';

/**
 * CSV Parser Transform
 * Parses CSV data into objects using the csv-parse library.
 */
export class CsvParserTransform extends Transform {
  private parser: ReturnType<typeof parse>;

  constructor(config: CsvParserStageConfig) {
    super({ objectMode: true });

    const { delimiter, hasHeaders, skipEmptyLines } = config.options;

    this.parser = parse({
      delimiter,
      columns: hasHeaders,
      skip_empty_lines: skipEmptyLines,
      cast: true, // Auto-cast numbers and booleans
      trim: true,
    });

    // Pipe parsed data through this transform
    this.parser.on('readable', () => {
      let record;
      while ((record = this.parser.read()) !== null) {
        this.push(record);
      }
    });

    this.parser.on('error', (err) => {
      this.destroy(err);
    });
  }

  _transform(
    chunk: Buffer | string,
    encoding: BufferEncoding,
    callback: (error?: Error | null) => void
  ): void {
    this.parser.write(chunk);
    callback();
  }

  _flush(callback: (error?: Error | null) => void): void {
    this.parser.end();
    this.parser.on('end', () => {
      callback();
    });
  }
}
