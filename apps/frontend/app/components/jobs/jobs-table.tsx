"use client";

import Link from "next/link";
import { useAtomValue, useAtomSet } from "@effect-atom/atom-react";
import { Result } from "@effect-atom/atom-react";
import { sortedJobsAtom, refreshJobsAtom } from "@/app/atoms";
import { JobStatusBadge } from "./job-status-badge";
import { formatBytes, formatRelativeTime } from "@/app/lib/utils";

export function JobsTable() {
  const jobsResult = useAtomValue(sortedJobsAtom);
  const refreshJobs = useAtomSet(refreshJobsAtom);

  return Result.builder(jobsResult)
    .onInitial(() => <JobsTableSkeleton />)
    .onWaiting(() => <JobsTableSkeleton />)
    .onFailure((cause) => (
      <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
          <svg
            className="h-6 w-6 text-red-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3 className="mt-4 font-medium text-red-900">Failed to load jobs</h3>
        <p className="mt-1 text-sm text-red-700">
          There was an error loading your jobs. Please try again.
        </p>
        <button
          onClick={() => refreshJobs()}
          className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          Try Again
        </button>
      </div>
    ))
    .onSuccess((jobs) => {
      if (jobs.length === 0) {
        return <JobsEmptyState />;
      }

      return (
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
          <table className="min-w-full divide-y divide-neutral-200">
            <thead className="bg-neutral-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  File
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Size
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 bg-white">
              {jobs.map((job) => (
                <tr
                  key={job.jobId}
                  className="transition-colors hover:bg-neutral-50"
                >
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-neutral-100">
                        <svg
                          className="h-5 w-5 text-neutral-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={1.5}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-neutral-900">
                          {job.fileName}
                        </p>
                        <p className="truncate text-sm text-neutral-500">
                          {job.jobId.slice(0, 8)}...
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <JobStatusBadge status={job.status} size="sm" />
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-500">
                    {formatBytes(job.bytesRead)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-500">
                    {formatRelativeTime(job.createdAt)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right">
                    <Link
                      href={`/jobs/${job.jobId}`}
                      className="inline-flex items-center gap-1 text-sm font-medium text-neutral-600 hover:text-neutral-900"
                    >
                      View
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
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    })
    .render();
}

function JobsTableSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
      <table className="min-w-full divide-y divide-neutral-200">
        <thead className="bg-neutral-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
              File
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Size
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Created
            </th>
            <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-200 bg-white">
          {[1, 2, 3].map((i) => (
            <tr key={i}>
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 animate-pulse rounded-lg bg-neutral-200" />
                  <div className="space-y-2">
                    <div className="h-4 w-32 animate-pulse rounded bg-neutral-200" />
                    <div className="h-3 w-20 animate-pulse rounded bg-neutral-200" />
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="h-6 w-20 animate-pulse rounded-full bg-neutral-200" />
              </td>
              <td className="px-6 py-4">
                <div className="h-4 w-16 animate-pulse rounded bg-neutral-200" />
              </td>
              <td className="px-6 py-4">
                <div className="h-4 w-20 animate-pulse rounded bg-neutral-200" />
              </td>
              <td className="px-6 py-4">
                <div className="h-4 w-12 animate-pulse rounded bg-neutral-200" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function JobsEmptyState() {
  return (
    <div className="rounded-xl border-2 border-dashed border-neutral-200 bg-white p-12 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100">
        <svg
          className="h-8 w-8 text-neutral-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
      </div>
      <h3 className="mt-4 text-lg font-medium text-neutral-900">No jobs yet</h3>
      <p className="mt-2 text-neutral-500">
        Upload a CSV file to start processing
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
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
        Upload File
      </Link>
    </div>
  );
}
