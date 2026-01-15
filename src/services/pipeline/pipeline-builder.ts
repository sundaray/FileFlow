import { Effect, Stream, Match } from "effect";
import type { PipelineConfig } from "../../types/job.types.js";
import {
  TransformError,
  UnknownStageTypeError,
  StreamConversionError,
} from "./errors.js";
import {
  filterRecords,
  uppercaseRecords,
  lowercaseRecords,
  compressStream,
  type CsvParserOptions,
  defaultCsvParserOptions,
} from "./transforms/index.js";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export type ObjectTransform = <E>(
  source: Stream.Stream<Record<string, unknown>, E>
) => Stream.Stream<Record<string, unknown>, E>;

export type ByteTransform = <E>(
  source: Stream.Stream<Uint8Array, E>
) => Stream.Stream<Uint8Array, E | StreamConversionError>;

export interface PipelineStages {
  readonly csvOptions: CsvParserOptions;
  readonly objectTransforms: ObjectTransform[];
  readonly jsonOptions: { pretty: boolean };
  readonly byteTransforms: ByteTransform[];
}

// ─────────────────────────────────────────────────────────────
// Builder
// ─────────────────────────────────────────────────────────────

/**
 * Build pipeline stages from configuration.
 * Parses the config and creates the appropriate transform functions.
 */
export function buildPipelineStages(
  config: PipelineConfig
): Effect.Effect<PipelineStages, TransformError> {
  return Effect.gen(function* () {
    const enabledStages = config.stages.filter((s) => s.enabled);

    let csvOptions: CsvParserOptions = { ...defaultCsvParserOptions };
    const objectTransforms: ObjectTransform[] = [];
    let jsonOptions = { pretty: false };
    const byteTransforms: ByteTransform[] = [];

    for (const stage of enabledStages) {
      const options = stage.options as Record<string, unknown>;

      yield* Match.value(stage.type).pipe(
        Match.when("csv-parser", () =>
          Effect.sync(() => {
            csvOptions = {
              delimiter: (options.delimiter as string) ?? ",",
              hasHeaders: (options.hasHeaders as boolean) ?? true,
              skipEmptyLines: (options.skipEmptyLines as boolean) ?? true,
            };
          })
        ),

        Match.when("filter", () =>
          Effect.gen(function* () {
            const transform = yield* filterRecords(
              options.field as string,
              options.operator as string,
              options.value as string | number
            );
            objectTransforms.push(transform);
          })
        ),

        Match.when("uppercase", () =>
          Effect.gen(function* () {
            const transform = yield* uppercaseRecords(
              (options.fields as string[] | "*") ?? "*"
            );
            objectTransforms.push(transform);
          })
        ),

        Match.when("lowercase", () =>
          Effect.gen(function* () {
            const transform = yield* lowercaseRecords(
              (options.fields as string[] | "*") ?? "*"
            );
            objectTransforms.push(transform);
          })
        ),

        Match.when("json-stringify", () =>
          Effect.sync(() => {
            jsonOptions = { pretty: (options.pretty as boolean) ?? false };
          })
        ),

        Match.when("compress", () =>
          Effect.gen(function* () {
            const transform = yield* compressStream(
              (options.algorithm as string) ?? "gzip",
              (options.level as number) ?? 6
            );
            byteTransforms.push(transform);
          })
        ),

        Match.orElse(() =>
          Effect.fail(
            new UnknownStageTypeError({
              stageType: stage.type,
              stageId: stage.id,
            })
          )
        )
      );
    }

    return { csvOptions, objectTransforms, jsonOptions, byteTransforms };
  });
}
