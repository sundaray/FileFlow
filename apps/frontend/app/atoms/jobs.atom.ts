/**
 * Jobs Atoms
 */

import { Atom, Result } from "@effect-atom/atom-react";
import { Effect, Schedule } from "effect";
import { getJobs } from "@/app/lib/api";
import type { JobSummary } from "@/app/types";

// ─────────────────────────────────────────────────────────────
// Jobs List Atom
// ─────────────────────────────────────────────────────────────

export const jobsAtom = Atom.make(
  Effect.gen(function* () {
    const response = yield* getJobs();
    return response.jobs as JobSummary[];
  }),
).pipe(Atom.keepAlive);

// ─────────────────────────────────────────────────────────────
// Refresh Jobs
// ─────────────────────────────────────────────────────────────

export const refreshJobsAtom = Atom.fn(
  Effect.gen(function* (get: Atom.Context) {
    get.refresh(jobsAtom);
  }),
);

// ─────────────────────────────────────────────────────────────
// Derived: Sorted Jobs (newest first)
// ─────────────────────────────────────────────────────────────

export const sortedJobsAtom = Atom.make((get) => {
  const result = get(jobsAtom);

  return Result.map(result, (jobs) =>
    [...jobs].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    ),
  );
});

// ─────────────────────────────────────────────────────────────
// Derived: Job Counts by Status
// ─────────────────────────────────────────────────────────────

export const jobCountsAtom = Atom.make((get) => {
  const result = get(jobsAtom);

  return Result.map(result, (jobs) => ({
    total: jobs.length,
    pending: jobs.filter((j) => j.status === "pending").length,
    processing: jobs.filter((j) => j.status === "processing").length,
    completed: jobs.filter((j) => j.status === "completed").length,
    failed: jobs.filter((j) => j.status === "failed").length,
    cancelled: jobs.filter((j) => j.status === "cancelled").length,
  }));
});
