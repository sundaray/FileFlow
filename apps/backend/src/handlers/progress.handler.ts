import { Effect, Stream, Option, Queue, Schedule } from "effect";
import { JobStore } from "../features/jobs/services/job-store.service.js";
import { JobProgress } from "../services/job-progress.service.js";
import {
  canSubscribe,
  toProgressEvent,
  isTerminalStatus,
  CanSubscribeOutput,
} from "../rules/progress.rule.js";
import type { ProgressEvent } from "../types/progress.types.js";

// ─────────────────────────────────────────────────────────────
// Validate Subscription Handler
// ─────────────────────────────────────────────────────────────

export interface ValidateSubscriptionHandlerInput {
  jobId: string;
}

export interface ValidateSubscriptionHandlerOutput {
  output: CanSubscribeOutput;
}

export function handleValidateSubscription(
  input: ValidateSubscriptionHandlerInput,
): Effect.Effect<ValidateSubscriptionHandlerOutput, never, JobStore> {
  return Effect.gen(function* () {
    const maybeJob = yield* JobStore.get(input.jobId);
    const job = Option.getOrNull(maybeJob);

    const output = canSubscribe({ job, jobId: input.jobId });

    return { output };
  });
}

// ─────────────────────────────────────────────────────────────
// Keepalive Stream (sends every 15 seconds)
// ─────────────────────────────────────────────────────────────

export const keepAliveStream: Stream.Stream<"keepalive", never, never> =
  Stream.repeat(
    Stream.make("keepalive" as const),
    Schedule.spaced("15 seconds"),
  );

// ─────────────────────────────────────────────────────────────
// Create Progress Stream Handler
// ─────────────────────────────────────────────────────────────
export function handleCreateProgressStream(
  jobId: string,
): Effect.Effect<
  Stream.Stream<ProgressEvent, never, JobProgress>,
  never,
  JobStore | JobProgress
> {
  return Effect.gen(function* () {
    // Subscribe to progress updates
    const queue = yield* JobProgress.subscribe(jobId);

    // Helper to get current job state as ProgressEvent
    const getCurrentProgress = Effect.gen(function* () {
      const maybeJob = yield* JobStore.get(jobId);
      const job = Option.getOrNull(maybeJob);

      if (job === null) return null;

      const memoryUsage = process.memoryUsage();
      const memoryUsageMb =
        Math.round((memoryUsage.heapUsed / 1024 / 1024) * 100) / 100;

      const isFinal = isTerminalStatus(job);

      return toProgressEvent({ job, memoryUsageMb, isFinal });
    });

    // Current stream from queue
    const queueStream = Stream.fromQueue(queue);

    // Get initial state
    const initialEvent = yield* getCurrentProgress;

    // Build the stream
    let progressStream: Stream.Stream<ProgressEvent, never, never>;

    if (initialEvent === null) {
      // Job disappeared, just send empty stream
      progressStream = Stream.empty;
    } else if (initialEvent.final) {
      // Already terminal, just send final event
      progressStream = Stream.make(initialEvent);
    } else {
      // Send initial event, then stream from queue until final
      progressStream = Stream.concat(
        Stream.make(initialEvent),
        Stream.takeUntil(queueStream, (event) => event.final === true),
      );
    }

    // Add cleanup when stream ends
    const streamWithCleanUp = Stream.ensuring(
      progressStream,
      JobProgress.unsubscribe(jobId, queue),
    );

    return streamWithCleanUp;
  });
}
