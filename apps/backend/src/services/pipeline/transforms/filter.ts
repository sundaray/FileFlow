import { Effect, Stream, Match } from "effect";
import { InvalidFilterConfigError } from "../errors.js";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

type FilterOperator =
  | "equals"
  | "not-equals"
  | "contains"
  | "greater-than"
  | "less-than"
  | "regex";

// ─────────────────────────────────────────────────────────────
// Validation
// ─────────────────────────────────────────────────────────────

function isValidFilterOperator(value: string): value is FilterOperator {
  return [
    "equals",
    "not-equals",
    "contains",
    "greater-than",
    "less-than",
    "regex",
  ].includes(value);
}

// ─────────────────────────────────────────────────────────────
// Predicate Factory
// ─────────────────────────────────────────────────────────────

function createFilterPredicate(
  field: string,
  operator: FilterOperator,
  value: string | number
): (record: Record<string, unknown>) => boolean {
  return (record) => {
    const fieldValue = record[field];

    return Match.value(operator).pipe(
      Match.when("equals", () => fieldValue === value),
      Match.when("not-equals", () => fieldValue !== value),
      Match.when(
        "contains",
        () =>
          typeof fieldValue === "string" && fieldValue.includes(String(value))
      ),
      Match.when(
        "greater-than",
        () => typeof fieldValue === "number" && fieldValue > Number(value)
      ),
      Match.when(
        "less-than",
        () => typeof fieldValue === "number" && fieldValue < Number(value)
      ),
      Match.when(
        "regex",
        () =>
          typeof fieldValue === "string" &&
          new RegExp(String(value)).test(fieldValue)
      ),
      Match.exhaustive
    );
  };
}

// ─────────────────────────────────────────────────────────────
// Transform Factory
// ─────────────────────────────────────────────────────────────

/**
 * Filter records based on field conditions.
 * Returns an Effect that yields a stream transformation function.
 */
export function filterRecords(
  field: string,
  operator: string,
  value: string | number
): Effect.Effect<
  <E>(
    source: Stream.Stream<Record<string, unknown>, E>
  ) => Stream.Stream<Record<string, unknown>, E>,
  InvalidFilterConfigError
> {
  return Effect.gen(function* () {
    if (!field) {
      return yield* new InvalidFilterConfigError({
        field,
        operator,
        message: "Field name is required for filter transform",
      });
    }

    if (!isValidFilterOperator(operator)) {
      return yield* new InvalidFilterConfigError({
        field,
        operator,
        message: `Invalid filter operator: ${operator}`,
      });
    }

    const predicate = createFilterPredicate(field, operator, value);

    return <E>(source: Stream.Stream<Record<string, unknown>, E>) =>
      Stream.filter(source, predicate);
  });
}
