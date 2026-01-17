import { Stream } from "effect";

/**
 * Convert records to JSON lines (NDJSON).
 * Each record becomes a single line of JSON followed by newline.
 */
export function jsonStringify(pretty: boolean) {
  const encoder = new TextEncoder();
  return function <TError>(
    source: Stream.Stream<Record<string, unknown>, TError>
  ): Stream.Stream<Uint8Array, TError> {
    return Stream.map(source, function (record) {
      const json = pretty
        ? JSON.stringify(record, null, 2)
        : JSON.stringify(record);
      return encoder.encode(json + "\n");
    });
  };
}
