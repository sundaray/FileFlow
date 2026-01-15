import { Effect, Stream, Chunk, pipe } from "effect";
import { parse as csvParse } from "csv-parse";
import { CsvParseError, PipelineError } from "../errors.js";
import { delimiter } from "path";
import { collect } from "effect/Record";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface CsvParserOptions {
  delimiter: string;
  hasHeaders: boolean;
  skipEmptyLines: boolean;
}

// ─────────────────────────────────────────────────────────────
// Default CSV Parse Options
// ─────────────────────────────────────────────────────────────
export const defaultCsvParserOptions: CsvParserOptions = {
  delimiter: ",",
  hasHeaders: true,
  skipEmptyLines: true,
};

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function combineChunks(chunks: Chunk.Chunk<Uint8Array>): Uint8Array {
  return Chunk.toReadonlyArray(chunks).reduce(function (acc, chunk) {
    const combined = new Uint8Array(acc.length + chunk.length);
    combined.set(acc);
    combined.set(chunk, acc.length);
    return combined;
  }, new Uint8Array(0));
}

/**
 * Parse a byte stream as CSV and emit records as objects.
 * Uses csv-parse under the hood but wraps it in Effect Stream.
 *
 * The approach:
 * 1. Collect all bytes from the input stream
 * 2. Create a csv-parse parser (which is an async iterable)
 * 3. Use Stream.fromAsyncIterable to convert parser output to Effect Stream
 */

export function parseCsvStream(options: CsvParserOptions) {
  return function (
    source: Stream.Stream<Uint8Array, PipelineError>
  ): Stream.Stream<Record<string, unknown>, PipelineError> {
    const collectAndParse = pipe(
      source,
      Stream.runCollect,
      Effect.map(function (chunks) {
        // Combine all chunks into a single buffer
        const allBytes = combineChunks(chunks);

        // Create csv parser - it implements AsyncIterable
        const parser = csvParse({
          delimiter: options.delimiter,
          columns: options.hasHeaders,
          skip_empty_lines: options.skipEmptyLines,
          cast: true,
          trim: true,
        });

        parser.write(Buffer.from(allBytes));
        parser.end();

        return Stream.fromAsyncIterable(parser, function (error) {
          return new CsvParseError({ cause: error });
        });
      })
    );

    return Stream.unwrap(collectAndParse);
  };
}
