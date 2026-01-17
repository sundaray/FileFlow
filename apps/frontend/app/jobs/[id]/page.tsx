"use client";

import { use } from "react";
import Link from "next/link";
import { JobProgress } from "@/app/components/job-detail";

interface JobDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function JobDetailPage({ params }: JobDetailPageProps) {
  const { id } = use(params);

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      {/* Back Button */}
      <Link
        href="/jobs"
        className="inline-flex items-center gap-2 text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900"
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
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Back to Jobs
      </Link>

      {/* Page Header */}
      <div className="mt-6">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
          Job Details
        </h1>
        <p className="mt-1 font-mono text-sm text-neutral-500">{id}</p>
      </div>

      {/* Job Progress */}
      <div className="mt-8">
        <JobProgress jobId={id} />
      </div>
    </div>
  );
}
