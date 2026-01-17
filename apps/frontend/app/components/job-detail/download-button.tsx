"use client";

import { useState, useCallback } from "react";
import { getDownloadUrl } from "@/app/lib/api";
import { cn } from "@/lib/utils";

interface DownloadButtonProps {
  jobId: string;
  className?: string;
}

export function DownloadButton({ jobId, className }: DownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = useCallback(() => {
    setIsDownloading(true);

    // Create a temporary link and trigger download
    const url = getDownloadUrl(jobId);
    const link = document.createElement("a");
    link.href = url;
    link.download = ""; // Let the server decide the filename
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Reset state after a short delay
    setTimeout(() => {
      setIsDownloading(false);
    }, 1000);
  }, [jobId]);

  return (
    <button
      onClick={handleDownload}
      disabled={isDownloading}
      className={cn(
        "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200",
        "bg-neutral-900 text-white hover:bg-neutral-800",
        "focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
    >
      {isDownloading ? (
        <>
          <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Downloading...
        </>
      ) : (
        <>
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
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          Download CSV
        </>
      )}
    </button>
  );
}
