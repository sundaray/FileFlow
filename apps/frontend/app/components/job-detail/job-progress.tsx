"use client";

import { useEffect, useState, useCallback } from "react";
import { JobStatusBadge } from "@/components/jobs/job-status-badge";
import { DownloadButton } from "./download-button";
import { formatBytes, formatDuration, formatDate } from "@/lib/utils";
import { getProgressUrl } from "@/lib/api";
import type { ProgressEvent, JobStatus } from "@/types";
import { cn } from "@/lib/utils";

interface JobProgressProps {
  jobId: string;
  initialStatus?: JobStatus;
}

export function JobProgress({ jobId, initialStatus }: JobProgressProps) {
  const [progress, setProgress] = useState<ProgressEvent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(true);

  useEffect(() => {
    const url = getProgressUrl(jobId);
    const eventSource = new EventSource(url);

    eventSource.onopen = () => {
      setIsConnecting(false);
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as ProgressEvent;
        setProgress(data);

        // Close connection when job is final
        if (data.final) {
          eventSource.close();
        }
      } catch (e) {
        // Ignore parse errors for non-JSON messages (like keepalive)
      }
    };

    eventSource.onerror = () => {
      setIsConnecting(false);
      setError("Connection lost. Please refresh the page.");
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [jobId]);

  if (isConnecting) {
    return <JobProgressSkeleton />;
  }

  if (error && !progress) {
    return (
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
        <h3 className="mt-4 font-medium text-red-900">Connection Error</h3>
        <p className="mt-1 text-sm text-red-700">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          Refresh Page
        </button>
      </div>
    );
  }

  if (!progress) {
    return <JobProgressSkeleton />;
  }

  const isTerminal = ["completed", "failed", "cancelled"].includes(progress.status);
  const progressPercent = isTerminal
    ? 100
    : progress.totalStages > 0
    ? Math.min(Math.round((progress.stageIndex / progress.totalStages) * 100), 99)
    : 0;

  return (
    <div className="space-y-6">
      {/* Status Header */}
      <div className="rounded-xl border border-neutral-200 bg-white p-6">
        <div className="flex items-start justify-between">
          <div>
            <JobStatusBadge status={progress.status} />
            <h2 className="mt-3 text-lg font-semibold text-neutral-900">
              {getStatusTitle(progress.status)}
            </h2>
            <p className="mt-1 text-sm text-neutral-500">
              {getStatusDescription(progress)}
            </p>
          </div>
          {progress.status === "completed" && (
            <DownloadButton jobId={jobId} />
          )}
        </div>

        {/* Progress Bar */}
        {!isTerminal && (
          <div className="mt-6">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-neutral-700">
                Stage {progress.stageIndex + 1} of {progress.totalStages}
              </span>
              <span className="text-neutral-500">{progressPercent}%</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-neutral-100">
              <div
                className="h-full rounded-full bg-neutral-900 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            {progress.currentStage && (
              <p className="mt-2 text-sm text-neutral-500">
                Current stage: {progress.currentStage}
              </p>
            )}
          </div>
        )}

        {/* Error Message */}
        {progress.status === "failed" && progress.error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-700">{progress.error}</p>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          label="Bytes Read"
          value={formatBytes(progress.bytesRead)}
          icon={
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              />
            </svg>
          }
        />
        <StatCard
          label="Bytes Written"
          value={formatBytes(progress.bytesWritten)}
          icon={
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
          }
        />
        <StatCard
          label="Rows Processed"
          value={progress.rowsProcessed.toLocaleString()}
          icon={
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 6h16M4 10h16M4 14h16M4 18h16"
              />
            </svg>
          }
        />
        <StatCard
          label="Memory Usage"
          value={`${progress.memoryUsageMb} MB`}
          icon={
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
              />
            </svg>
          }
        />
      </div>

      {/* Timeline */}
      <div className="rounded-xl border border-neutral-200 bg-white p-6">
        <h3 className="font-medium text-neutral-900">Timeline</h3>
        <div className="mt-4 space-y-3">
          <TimelineItem
            label="Started"
            value={progress.startedAt ? formatDate(progress.startedAt) : "—"}
            isActive
          />
          <TimelineItem
            label="Last Updated"
            value={formatDate(progress.updatedAt)}
            isActive
          />
          <TimelineItem
            label="Completed"
            value={progress.completedAt ? formatDate(progress.completedAt) : "—"}
            isActive={!!progress.completedAt}
          />
          {progress.startedAt && progress.completedAt && (
            <TimelineItem
              label="Duration"
              value={formatDuration(progress.startedAt, progress.completedAt)}
              isActive
            />
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-100 text-neutral-500">
          {icon}
        </div>
        <div>
          <p className="text-sm text-neutral-500">{label}</p>
          <p className="font-semibold text-neutral-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

function TimelineItem({
  label,
  value,
  isActive,
}: {
  label: string;
  value: string;
  isActive: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span
        className={cn(
          "text-sm",
          isActive ? "text-neutral-700" : "text-neutral-400"
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          "text-sm font-medium",
          isActive ? "text-neutral-900" : "text-neutral-400"
        )}
      >
        {value}
      </span>
    </div>
  );
}

function JobProgressSkeleton() {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-neutral-200 bg-white p-6">
        <div className="h-6 w-24 animate-pulse rounded-full bg-neutral-200" />
        <div className="mt-3 h-6 w-48 animate-pulse rounded bg-neutral-200" />
        <div className="mt-2 h-4 w-64 animate-pulse rounded bg-neutral-200" />
        <div className="mt-6">
          <div className="h-2 w-full animate-pulse rounded-full bg-neutral-200" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-neutral-200 bg-white p-4"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 animate-pulse rounded-lg bg-neutral-200" />
              <div className="space-y-2">
                <div className="h-3 w-16 animate-pulse rounded bg-neutral-200" />
                <div className="h-5 w-20 animate-pulse rounded bg-neutral-200" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function getStatusTitle(status: JobStatus): string {
  switch (status) {
    case "pending":
      return "Waiting to Start";
    case "processing":
      return "Processing Your File";
    case "completed":
      return "Processing Complete";
    case "failed":
      return "Processing Failed";
    case "cancelled":
      return "Processing Cancelled";
  }
}

function getStatusDescription(progress: ProgressEvent): string {
  switch (progress.status) {
    case "pending":
      return "Your file is in the queue and will start processing shortly.";
    case "processing":
      return `Processing ${formatBytes(progress.bytesRead)} of data...`;
    case "completed":
      return `Successfully processed ${progress.rowsProcessed.toLocaleString()} rows.`;
    case "failed":
      return "An error occurred while processing your file.";
    case "cancelled":
      return "The job was cancelled before completion.";
  }
}
