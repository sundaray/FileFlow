import { Effect, Stream, Chunk, pipe } from "effect";
import { FileSystem } from "@effect/platform";
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
// Executor
// ─────────────────────────────────────────────────────────────

/**
 * Execute the full pipeline using Effect Streams.
 *
 * Pipeline flow:
 * 1. Read file as byte stream (using @effect/platform FileSystem)
 * 2. Parse CSV into record stream
 * 3. Apply object transforms (filter, uppercase, etc.)
 * 4. Convert to JSON lines
 * 5. Apply byte transforms (compression)
 * 6. Write to output file
 */
export function executePipeline(
  inputPath: string,
  outputPath: string,
  stages: PipelineStages,
  onProgress: (bytesRead: number, bytesWritten: number) => Effect.Effect<void>
): Effect.Effect<PipelineResult, PipelineError, FileSystem.FileSystem> {
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

    // Step 6: Collect output and write to file
    const outputChunks = yield* Stream.runCollect(outputStream);

    // Combine all chunks into a single Uint8Array
    const allOutput = Chunk.toReadonlyArray(outputChunks).reduce(
      (acc, chunk) => {
        const combined = new Uint8Array(acc.length + chunk.length);
        combined.set(acc);
        combined.set(chunk, acc.length);
        return combined;
      },
      new Uint8Array(0)
    );

    totalBytesWritten = allOutput.length;

    // Write to file using Effect Platform
    yield* fs.writeFile(outputPath, allOutput).pipe(
      Effect.mapError(
        (e) =>
          new FileWriteError({
            path: outputPath,
            cause: e,
          }) as PipelineError
      )
    );

    // Final progress update
    yield* onProgress(totalBytesRead, totalBytesWritten);

    return { bytesRead: totalBytesRead, bytesWritten: totalBytesWritten };
  });
}
