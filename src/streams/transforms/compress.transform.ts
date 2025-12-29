import { Transform } from 'node:stream';
import { createGzip, createDeflate, createBrotliCompress } from 'node:zlib';
import type { CompressStageConfig } from '../../types/pipeline.types.js';

/**
 * Compress Transform
 * Compresses data using gzip, brotli, or deflate algorithms.
 * This is a wrapper around Node.js zlib compression streams.
 */
export class CompressTransform extends Transform {
  private compressor: Transform;

  constructor(config: CompressStageConfig) {
    super();

    const { algorithm, level } = config.options;

    switch (algorithm) {
      case 'gzip':
        this.compressor = createGzip({ level });
        break;

      case 'deflate':
        this.compressor = createDeflate({ level });
        break;

      case 'brotli':
        this.compressor = createBrotliCompress({
          params: {
            // Brotli uses different parameter names
            [require('node:zlib').constants.BROTLI_PARAM_QUALITY]: level,
          },
        });
        break;

      default:
        throw new Error(`Unsupported compression algorithm: ${algorithm}`);
    }

    // Forward compressed data
    this.compressor.on('data', (chunk) => {
      this.push(chunk);
    });

    this.compressor.on('error', (err) => {
      this.destroy(err);
    });
  }

  _transform(
    chunk: Buffer | string,
    encoding: BufferEncoding,
    callback: (error?: Error | null) => void
  ): void {
    this.compressor.write(chunk, encoding);
    callback();
  }

  _flush(callback: (error?: Error | null) => void): void {
    this.compressor.end();
    this.compressor.on('end', () => {
      callback();
    });
  }
}
