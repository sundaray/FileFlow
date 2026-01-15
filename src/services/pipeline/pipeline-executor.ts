import { Effect, Stream, pipe } from "effect";
import { FileSystem } from "@effect/platform";
import { createWriteStream, type WriteStream } from "node:fs";
import {
  PipelineError,
  PipelineExecutionError,
  FileWriteError,
} from "./errors.js";
import { parseCsvStream, jsonStringify } from "./transforms/index.js";
import type { PipelineStages } from "./pipeline-builder.js";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface PipelineResult {
  readonly bytesRead: number;
  readonly bytesWritten: number;
}

// ─────────────────────────────────────────────────────────────
// File Write Helpers
// ─────────────────────────────────────────────────────────────

/**
 * Write a single chunk to the write stream.
 * Handles Node.js backpressure by waiting for 'drain' if needed.
 */
function writeChunk(
  writeStream: WriteStream,
  chunk: Uint8Array
): Effect.Effect<number, Error> {
  return Effect.async<number, Error>((resume) => {
    const canContinue = writeStream.write(chunk, (err) => {
      if (err) {
        resume(Effect.fail(err));
      } else {
        resume(Effect.succeed(chunk.length));
      }
    });

    // Handle backpressure - if buffer is full, Node will
    // queue the write and call our callback when done
    if (!canContinue) {
      writeStream.once("drain", () => {
        // Write already queued, callback handles completion
      });
    }
  });
}

/**
 * Open a write stream for the output file.
 */
function openWriteStream(
  path: string
): Effect.Effect<WriteStream, FileWriteError> {
  return Effect.try({
    try: () => createWriteStream(path),
    catch: (cause) => new FileWriteError({ path, cause }),
  });
}

/**
 * Close the write stream gracefully.
 */
function closeWriteStream(writeStream: WriteStream): Effect.Effect<void> {
  return Effect.async<void>((resume) => {
    writeStream.end(() => {
      resume(Effect.succeed(undefined));
    });
  });
}

// ─────────────────────────────────────────────────────────────
// Executor
// ─────────────────────────────────────────────────────────────

/**
 * Execute the full pipeline using Effect Streams with TRUE streaming writes.
 *
 * Pipeline flow:
 * 1. Read file as byte stream (using @effect/platform FileSystem)
 * 2. Parse CSV into record stream
 * 3. Apply object transforms (filter, uppercase, etc.)
 * 4. Convert to JSON lines
 * 5. Apply byte transforms (compression)
 * 6. Stream each chunk directly to output file (NO BUFFERING)
 *
 * Memory usage: O(1) - only one chunk in memory at a time
 */
export function executePipeline<TReq>(
  inputPath: string,
  outputPath: string,
  stages: PipelineStages,
  onProgress: (
    bytesRead: number,
    bytesWritten: number
  ) => Effect.Effect<void, never, TReq>
): Effect.Effect<PipelineResult, PipelineError, FileSystem.FileSystem | TReq> {
  return Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;

    let totalBytesRead = 0;
    let totalBytesWritten = 0;

    // Step 1: Read file as byte stream using Effect Platform
    const fileStream: Stream.Stream<Uint8Array, PipelineError> = pipe(
      fs.stream(inputPath),
      Stream.mapError(
        (e) =>
          new PipelineExecutionError({
            jobId: "unknown",
            cause: e,
          }) as PipelineError
      )
    );

    // Track bytes read using Stream.tap
    const trackedInputStream = Stream.tap(fileStream, (chunk) =>
      Effect.sync(() => {
        totalBytesRead += chunk.length;
      })
    );

    // Step 2: Parse CSV
    const parsedStream = parseCsvStream(stages.csvOptions)(trackedInputStream);

    // Step 3: Apply object transforms (filter, uppercase, etc.)
    let transformedStream: Stream.Stream<
      Record<string, unknown>,
      PipelineError
    > = parsedStream;

    for (const transform of stages.objectTransforms) {
      transformedStream = transform(transformedStream);
    }

    // Step 4: Convert to JSON lines
    const jsonStream = jsonStringify(stages.jsonOptions.pretty)(
      transformedStream
    );

    // Step 5: Apply byte transforms (compression)
    let outputStream: Stream.Stream<Uint8Array, PipelineError> = jsonStream;

    for (const transform of stages.byteTransforms) {
      outputStream = transform(outputStream) as Stream.Stream<
        Uint8Array,
        PipelineError
      >;
    }

    // Step 6: Stream directly to file using acquireUseRelease pattern
    // This ensures the file handle is properly closed even on errors
    yield* Effect.acquireUseRelease(
      // Acquire: Open write stream
      openWriteStream(outputPath),

      // Use: Stream each chunk directly to the file
      (writeStream) =>
        Stream.runForEach(outputStream, (chunk) =>
          Effect.gen(function* () {
            const bytesWritten = yield* writeChunk(writeStream, chunk).pipe(
              Effect.mapError(
                (cause) =>
                  new FileWriteError({
                    path: outputPath,
                    cause,
                  }) as PipelineError
              )
            );
            totalBytesWritten += bytesWritten;
          })
        ),

      // Release: Close the write stream (runs even on error)
      (writeStream) => closeWriteStream(writeStream)
    );

    // Final progress update
    yield* onProgress(totalBytesRead, totalBytesWritten);

    return { bytesRead: totalBytesRead, bytesWritten: totalBytesWritten };
  });
}
