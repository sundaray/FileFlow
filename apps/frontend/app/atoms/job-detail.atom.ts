/**
 * Job Detail Atoms
 */

import { Atom, Result } from "@effect-atom/atom-react";
import { Effect, Stream } from "effect";
import { getJob, getProgressUrl } from "@/app/lib/api";
import type { ProgressEvent, JobDetails } from "@/app/types";

// ─────────────────────────────────────────────────────────────
// Job Detail Atom Family
// ─────────────────────────────────────────────────────────────

export const jobDetailAtom = Atom.family((jobId: string) =>
  Atom.make(
    Effect.gen(function* () {
      const response = yield* getJob(jobId);
      return response.job;
    }),
  ),
);

// ─────────────────────────────────────────────────────────────
// SSE Progress Stream
// ─────────────────────────────────────────────────────────────

function createProgressStream(
  jobId: string,
): Stream.Stream<ProgressEvent, Error> {
  return Stream.async<ProgressEvent, Error>((emit) => {
    const url = getProgressUrl(jobId);
    const eventSource = new EventSource(url);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as ProgressEvent;
        emit.single(data);

        // Close connection when job is final
        if (data.final) {
          eventSource.close();
          emit.end();
        }
      } catch (error) {
        // Ignore parse errors for non-JSON messages (like keepalive)
      }
    };

    eventSource.onerror = (error) => {
      eventSource.close();
      emit.fail(new Error("SSE connection error"));
    };

    // Cleanup function
    return Effect.sync(() => {
      eventSource.close();
    });
  });
}

// ─────────────────────────────────────────────────────────────
// Progress Atom Family
// ─────────────────────────────────────────────────────────────

export const jobProgressAtom = Atom.family((jobId: string) =>
  Atom.make(createProgressStream(jobId)),
);

// ─────────────────────────────────────────────────────────────
// Derived: Is Job Terminal
// ─────────────────────────────────────────────────────────────

export function isTerminalStatus(status: string): boolean {
  return ["completed", "failed", "cancelled"].includes(status);
}

// ─────────────────────────────────────────────────────────────
// Derived: Progress Percentage
// ─────────────────────────────────────────────────────────────

export function calculateProgress(event: ProgressEvent): number {
  if (event.totalStages === 0) return 0;
  if (isTerminalStatus(event.status)) return 100;

  // Base progress on stage index
  const stageProgress = (event.stageIndex / event.totalStages) * 100;

  return Math.min(Math.round(stageProgress), 99);
}
