import { Effect, Ref, Option, HashMap } from "effect";
import type { Job } from "../../../types/job.types.js";

// ─────────────────────────────────────────────────────────────
// The Service
// ─────────────────────────────────────────────────────────────

export class JobStore extends Effect.Service<JobStore>()("JobStore", {
  effect: Effect.gen(function* () {
    const store = yield* Ref.make<HashMap.HashMap<string, Job>>(
      HashMap.empty(),
    );

    return {
      getAll: Ref.get(store).pipe(
        Effect.map((jobs) => Array.from(HashMap.values(jobs))),
      ),

      get: (id: string) =>
        Ref.get(store).pipe(Effect.map((jobs) => HashMap.get(jobs, id))),

      set: (job: Job) =>
        Ref.update(store, (jobs) => HashMap.set(jobs, job.id, job)),

      update: (id: string, updates: Partial<Job>) =>
        Ref.modify(store, (jobs) => {
          const existing = HashMap.get(jobs, id);

          if (Option.isNone(existing)) {
            return [Option.none(), jobs];
          }

          const updated: Job = {
            ...existing.value,
            ...updates,
            updatedAt: new Date(),
          };

          return [Option.some(updated), HashMap.set(jobs, id, updated)];
        }),

      remove: (id: string) =>
        Ref.modify(store, (jobs) => {
          if (!HashMap.has(jobs, id)) {
            return [false, jobs];
          }

          return [true, HashMap.remove(jobs, id)];
        }),

      isOperational: Effect.succeed(true),
    };
  }),
  accessors: true,
}) {}
