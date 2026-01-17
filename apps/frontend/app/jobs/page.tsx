"use client";

import Link from "next/link";
import { useAtomSet } from "@effect-atom/atom-react";
import { JobsTable } from "@/app/components/jobs";
import { refreshJobsAtom } from "@/app/atoms";

export default function JobsPage() {
  const refreshJobs = useAtomSet(refreshJobsAtom);

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
            Your Jobs
          </h1>
          <p className="mt-1 text-neutral-600">
            View and manage all your file processing jobs
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => refreshJobs()}
            className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Refresh
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4v16m8-8H4"
              />
            </svg>
            New Upload
          </Link>
        </div>
      </div>

      {/* Jobs Table */}
      <div className="mt-8">
        <JobsTable />
      </div>
    </div>
  );
}
