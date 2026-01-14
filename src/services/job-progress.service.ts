import { Effect, Queue, Ref } from "effect";
import type { ProgressEvent } from "../types/progress.types.js";

export class JobProgress extends Effect.Service<JobProgress>()("JobProgress", {
  effect: Effect.gen(function* () {
    const subscribers = yield* Ref.make<
      Map<string, Set<Queue.Enqueue<ProgressEvent>>>
    >(new Map());

    return {
      /**
       * Publish a progress update for a job.
       * Sends to all subscribers of that specific job.
       */
      publish: (event: ProgressEvent) =>
        Effect.gen(function* () {
          const subs = yield* Ref.get(subscribers);
          const jobSubs = subs.get(event.jobId);

          if (jobSubs) {
            for (const queue of jobSubs) {
              yield* Queue.offer(queue, event);
            }
          }
        }),

      /**
       * Subscribe to progress updates for a specific job.
       * Returns a Dequeue that receives events for that job.
       */
      subscribe: (jobId: string) =>
        Effect.gen(function* () {
          const queue = yield* Queue.bounded<ProgressEvent>(100);

          yield* Ref.update(subscribers, (map) => {
            const newMap = new Map(map);
            const existing = newMap.get(jobId) ?? new Set();
            existing.add(queue);
            newMap.set(jobId, existing);
            return newMap;
          });

          return queue as Queue.Dequeue<ProgressEvent>;
        }),

      /**
       * Unsubscribe from progress updates.
       */
      unsubscribe: (jobId: string, queue: Queue.Dequeue<ProgressEvent>) =>
        Effect.gen(function* () {
          yield* Ref.update(subscribers, (map) => {
            const newMap = new Map(map);
            const existing = newMap.get(jobId);

            if (existing) {
              existing.delete(queue as unknown as Queue.Enqueue<ProgressEvent>);

              if (existing.size === 0) {
                newMap.delete(jobId);
              }
            }
            return newMap;
          });

          yield* Queue.shutdown(queue);
        }),
    };
  }),
  accessors: true,
}) {}
