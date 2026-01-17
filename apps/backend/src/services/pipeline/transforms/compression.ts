import { Effect, Stream, Chunk, Match, pipe } from "effect";
import {
  createGzip,
  createDeflate,
  createBrotliCompress,
  constants,
} from "node:zlib";
import { Transform } from "node:stream";
import {
  UnsupportedCompressionAlgorithmError,
  StreamConversionError,
} from "../errors.js";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

type CompressionAlgorithm = "gzip" | "brotli" | "deflate";

// ─────────────────────────────────────────────────────────────
// Validation
// ─────────────────────────────────────────────────────────────

function isValidCompressionAlgorithm(
  value: string
): value is CompressionAlgorithm {
  return ["gzip", "brotli", "deflate"].includes(value);
}

// ─────────────────────────────────────────────────────────────
// Node.js Transform Bridge
// ─────────────────────────────────────────────────────────────

/**
 * Pipe an Effect Stream of bytes through a Node.js Transform stream.
 * Used for compression which relies on Node.js zlib transforms.
 *
 * This collects all input chunks, pipes them through the transform,
 * then emits the compressed output.
 */
function throughNodeTransform(
  createTransform: () => Transform
): <E>(
  source: Stream.Stream<Uint8Array, E>
) => Stream.Stream<Uint8Array, E | StreamConversionError> {
  return <E>(source: Stream.Stream<Uint8Array, E>) =>
    pipe(
      source,
      Stream.runCollect,
      Effect.flatMap((chunks) =>
        Effect.async<Chunk.Chunk<Uint8Array>, StreamConversionError>(
          (resume) => {
            const transform = createTransform();
            const outputChunks: Uint8Array[] = [];

            // Combine all input chunks
            const allBytes = Chunk.toReadonlyArray(chunks).reduce(
              (acc, chunk) => {
                const combined = new Uint8Array(acc.length + chunk.length);
                combined.set(acc);
                combined.set(chunk, acc.length);
                return combined;
              },
              new Uint8Array(0)
            );

            transform.on("data", (chunk: Buffer) => {
              outputChunks.push(new Uint8Array(chunk));
            });

            transform.on("end", () => {
              resume(Effect.succeed(Chunk.fromIterable(outputChunks)));
            });

            transform.on("error", (error) => {
              resume(Effect.fail(new StreamConversionError({ cause: error })));
            });

            // Write all data and signal end
            transform.write(Buffer.from(allBytes));
            transform.end();
          }
        )
      ),
      Effect.map((chunks) => Stream.fromChunk(chunks)),
      Stream.unwrap
    );
}

// ─────────────────────────────────────────────────────────────
// Transform Factory
// ─────────────────────────────────────────────────────────────

/**
 * Create a compression transform function.
 * Uses Match for selecting the appropriate zlib compressor.
 */
export function compressStream(
  algorithm: string,
  level: number
): Effect.Effect<
  <E>(
    source: Stream.Stream<Uint8Array, E>
  ) => Stream.Stream<Uint8Array, E | StreamConversionError>,
  UnsupportedCompressionAlgorithmError
> {
  const normalizedAlgorithm = algorithm || "gzip";

  if (!isValidCompressionAlgorithm(normalizedAlgorithm)) {
    return Effect.fail(
      new UnsupportedCompressionAlgorithmError({
        algorithm: normalizedAlgorithm,
      })
    );
  }

  const createCompressor = Match.value(normalizedAlgorithm).pipe(
    Match.when(
      "brotli",
      () => () =>
        createBrotliCompress({
          params: { [constants.BROTLI_PARAM_QUALITY]: level },
        })
    ),
    Match.when("deflate", () => () => createDeflate({ level })),
    Match.when("gzip", () => () => createGzip({ level })),
    Match.exhaustive
  );

  return Effect.succeed(throughNodeTransform(createCompressor));
}
