"use client";

import { UploadForm } from "@/app/components/upload";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      {/* Hero Section */}
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
          Transform Your CSV Files
        </h1>
        <p className="mt-4 text-lg text-neutral-600">
          Upload your CSV file, choose a text transformation, and download the
          processed result. Simple, fast, and efficient.
        </p>
      </div>

      {/* Upload Form */}
      <div className="mt-12">
        <UploadForm />
      </div>

      {/* Features */}
      <div className="mt-16 grid grid-cols-3 gap-6">
        <FeatureCard
          title="Stream Processing"
          description="Handles files of any size with memory-efficient streaming"
          icon={
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          }
        />
        <FeatureCard
          title="Real-time Progress"
          description="Watch your file being processed with live updates"
          icon={
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          }
        />
        <FeatureCard
          title="Instant Download"
          description="Get your transformed CSV file as soon as it's ready"
          icon={
            <svg
              className="h-6 w-6"
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
      </div>
    </div>
  );
}

function FeatureCard({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-100 text-neutral-600">
        {icon}
      </div>
      <h3 className="mt-4 font-medium text-neutral-900">{title}</h3>
      <p className="mt-1 text-sm text-neutral-500">{description}</p>
    </div>
  );
}
