import { Effect } from "effect";
import { FileSystem } from "@effect/platform";
import { NodeFileSystem } from "@effect/platform-node";
import { createWriteStream } from "node:fs";
import type { Readable } from "node:stream";

export class FileStream extends Effect.Service<FileStream>()("FileStream", {
  effect: Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;

    return {
      /**
       * Stream data to a file on disk.
       * Creates parent directories if needed.
       * Returns total bytes written.
       */
      streamToFile: (source: Readable, destPath: string) =>
        Effect.async<number, Error>((resume) => {
          let bytesWritten = 0;

          const writeStream = createWriteStream(destPath);

          source.on("data", (chunk: Buffer) => {
            bytesWritten += chunk.length;
          });

          writeStream.on("finish", () => {
            resume(Effect.succeed(bytesWritten));
          });

          source.on("error", (error) => {
            writeStream.destroy();
            resume(Effect.fail(error));
          });

          writeStream.on("error", (error) => {
            source.destroy();
            resume(Effect.fail(error));
          });

          source.pipe(writeStream);
        }),
      /**
       * Ensure directory exists for a file path.
       */
      ensureDir: (filePath: string) =>
        Effect.gen(function* () {
          const lastSlash = filePath.lastIndexOf("/");
          if (lastSlash > 0) {
            const dir = filePath.substring(0, lastSlash);
            yield* fs.makeDirectory(dir, { recursive: true });
          }
        }),
    };
  }),
  dependencies: [NodeFileSystem.layer],
  accessors: true,
}) {}
