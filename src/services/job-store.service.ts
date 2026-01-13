import { Effect, Ref, Option } from "effect";
import type { Job } from "../types/job.types.js";

// ─────────────────────────────────────────────────────────────
// The Service
// ─────────────────────────────────────────────────────────────

export class JobStore extends Effect.Service<JobStore>()("JobStore", {
  effect: Effect.gen(function* () {
    // store holds the Map of all jobs
    const store = yield* Ref.make<Map<string, Job>>(new Map());

    return {
      getAll: Ref.get(store).pipe(
        Effect.map((jobs) => Array.from(jobs.values()))
      ),

      get: (id: string) =>
        Ref.get(store).pipe(
          Effect.map((jobs) => Option.fromNullable(jobs.get(id)))
        ),

      set: (job: Job) =>
        Ref.update(store, (jobs) => {
          const newJobs = new Map(jobs);
          newJobs.set(job.id, job);
          return newJobs;
        }),

      update: (id: string, updates: Partial<Job>) => {
        Ref.modify(store, (jobs) => {
          const existing = jobs.get(id);

          if (!existing) {
            return [Option.none(), jobs];
          }

          const updated: Job = {
            ...existing,
            ...updates,
            updatedAt: new Date(),
          };

          const newJobs = new Map(jobs);
          newJobs.set(id, updated);
          return [Option.some(updated), newJobs];
        });
      },

      remove: (id: string) =>
        Ref.modify(store, (jobs) => {
          if (!jobs.has(id)) {
            return [false, jobs];
          }

          const newJobs = new Map(jobs);
          newJobs.delete(id);
          return [true, newJobs];
        }),

      isOperational: Effect.succeed(true),
    };
  }),
  accessors: true,
}) {}
