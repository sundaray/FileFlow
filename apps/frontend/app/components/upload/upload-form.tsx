"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAtomValue, useAtomSet } from "@effect-atom/atom-react";
import { Effect } from "effect";
import {
  selectedFileAtom,
  textTransformAtom,
  isUploadingAtom,
  uploadErrorAtom,
  canSubmitAtom,
} from "@/app/atoms";
import { uploadFile } from "@/app/lib/api";
import { FileDropzone } from "./file-dropzone";
import { TransformSelector } from "./transform-selector";
import { cn } from "@/lib/utils";

export function UploadForm() {
  const router = useRouter();
  const selectedFile = useAtomValue(selectedFileAtom);
  const textTransform = useAtomValue(textTransformAtom);
  const isUploading = useAtomValue(isUploadingAtom);
  const uploadError = useAtomValue(uploadErrorAtom);
  const canSubmit = useAtomValue(canSubmitAtom);

  const setIsUploading = useAtomSet(isUploadingAtom);
  const setUploadError = useAtomSet(uploadErrorAtom);
  const setSelectedFile = useAtomSet(selectedFileAtom);
  const setTextTransform = useAtomSet(textTransformAtom);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!selectedFile || !textTransform) return;

      setIsUploading(true);
      setUploadError(null);

      const program = uploadFile(selectedFile, textTransform);

      const result = await Effect.runPromiseExit(program);

      if (result._tag === "Success") {
        const { jobId } = result.value;
        // Reset form
        setSelectedFile(null);
        setTextTransform(null);
        setIsUploading(false);
        // Redirect to job page
        router.push(`/jobs/${jobId}`);
      } else {
        setIsUploading(false);
        // Extract error message
        const cause = result.cause;
        if (cause._tag === "Fail") {
          const error = cause.error;
          if ("message" in error) {
            setUploadError(error.message as string);
          } else {
            setUploadError("An unexpected error occurred");
          }
        } else {
          setUploadError("An unexpected error occurred");
        }
      }
    },
    [
      selectedFile,
      textTransform,
      setIsUploading,
      setUploadError,
      setSelectedFile,
      setTextTransform,
      router,
    ],
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* File Dropzone */}
      <FileDropzone />

      {/* Transform Selector */}
      <TransformSelector />

      {/* Error Message */}
      {uploadError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <svg
              className="h-5 w-5 flex-shrink-0 text-red-500"
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
            <p className="text-sm text-red-700">{uploadError}</p>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={!canSubmit}
        className={cn(
          "flex w-full items-center justify-center gap-2 rounded-xl px-6 py-4 text-base font-semibold transition-all duration-200",
          canSubmit
            ? "bg-neutral-900 text-white hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:ring-offset-2"
            : "cursor-not-allowed bg-neutral-200 text-neutral-400",
        )}
      >
        {isUploading ? (
          <>
            <svg
              className="h-5 w-5 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
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
            Uploading...
          </>
        ) : (
          <>
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            Process File
          </>
        )}
      </button>

      {/* Help text */}
      {!canSubmit && !uploadError && (
        <p className="text-center text-sm text-neutral-500">
          {!selectedFile && !textTransform
            ? "Select a CSV file and choose a text transform to continue"
            : !selectedFile
              ? "Select a CSV file to continue"
              : "Choose a text transform to continue"}
        </p>
      )}
    </form>
  );
}
