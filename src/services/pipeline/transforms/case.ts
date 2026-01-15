import { Effect, Stream } from "effect";
import { InvalidFieldsConfigError } from "../errors.js";

// ─────────────────────────────────────────────────────────────
// Validation
// ─────────────────────────────────────────────────────────────

function isValidFieldsConfig(fields: unknown): fields is string[] | "*" {
  if (fields === "*") return true;
  if (!Array.isArray(fields)) return false;
  return fields.every((f) => typeof f === "string");
}

// ─────────────────────────────────────────────────────────────
// Transform Factories
// ─────────────────────────────────────────────────────────────

/**
 * Transform string fields to uppercase.
 * Uses Stream.map for pure transformation.
 */
export function uppercaseRecords(
  fields: string[] | "*"
): Effect.Effect<
  <E>(
    source: Stream.Stream<Record<string, unknown>, E>
  ) => Stream.Stream<Record<string, unknown>, E>,
  InvalidFieldsConfigError
> {
  return Effect.gen(function* () {
    if (!isValidFieldsConfig(fields)) {
      return yield* new InvalidFieldsConfigError({
        fields,
        message: 'Fields must be an array of strings or "*"',
      });
    }

    return <E>(source: Stream.Stream<Record<string, unknown>, E>) =>
      Stream.map(source, (record) => {
        const result = { ...record };
        const keys = fields === "*" ? Object.keys(result) : fields;

        for (const key of keys) {
          if (typeof result[key] === "string") {
            result[key] = (result[key] as string).toUpperCase();
          }
        }

        return result;
      });
  });
}

/**
 * Transform string fields to lowercase.
 * Uses Stream.map for pure transformation.
 */
export function lowercaseRecords(
  fields: string[] | "*"
): Effect.Effect<
  <E>(
    source: Stream.Stream<Record<string, unknown>, E>
  ) => Stream.Stream<Record<string, unknown>, E>,
  InvalidFieldsConfigError
> {
  return Effect.gen(function* () {
    if (!isValidFieldsConfig(fields)) {
      return yield* new InvalidFieldsConfigError({
        fields,
        message: 'Fields must be an array of strings or "*"',
      });
    }

    return <E>(source: Stream.Stream<Record<string, unknown>, E>) =>
      Stream.map(source, (record) => {
        const result = { ...record };
        const keys = fields === "*" ? Object.keys(result) : fields;

        for (const key of keys) {
          if (typeof result[key] === "string") {
            result[key] = (result[key] as string).toLowerCase();
          }
        }

        return result;
      });
  });
}
