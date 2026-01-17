"use client";

import { useState, useCallback } from "react";
import {
  DropZone as AriaDropZone,
  FileTrigger,
  Button,
  Text,
} from "react-aria-components";
import { useAtomValue, useAtomSet } from "@effect-atom/atom-react";
import { selectedFileAtom, uploadErrorAtom } from "@/app/atoms";
import {
  cn,
  formatBytes,
  isValidCsvFile,
  isValidFileSize,
  MAX_FILE_SIZE,
} from "@/app/lib/utils";

export function FileDropzone() {
  const selectedFile = useAtomValue(selectedFileAtom);
  const setSelectedFile = useAtomSet(selectedFileAtom);
  const setUploadError = useAtomSet(uploadErrorAtom);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;

      const file = files[0];

      // Validate file type
      if (!isValidCsvFile(file)) {
        setUploadError("Please select a valid CSV file");
        return;
      }

      // Validate file size
      if (!isValidFileSize(file)) {
        setUploadError(
          `File size exceeds the maximum limit of ${formatBytes(MAX_FILE_SIZE)}`,
        );
        return;
      }

      setUploadError(null);
      setSelectedFile(file);
    },
    [setSelectedFile, setUploadError],
  );

  const handleClearFile = useCallback(() => {
    setSelectedFile(null);
    setUploadError(null);
  }, [setSelectedFile, setUploadError]);

  return (
    <div className="space-y-3">
      <AriaDropZone
        onDropEnter={() => setIsDragging(true)}
        onDropExit={() => setIsDragging(false)}
        getDropOperation={(types) =>
          types.has("text/csv") ||
          types.has("application/csv") ||
          types.has("text/plain")
            ? "copy"
            : "cancel"
        }
        onDrop={async (e) => {
          setIsDragging(false);
          const files = e.items.filter((item) => item.kind === "file");
          if (files.length > 0) {
            const fileItem = files[0];
            if (fileItem.kind === "file") {
              const file = await fileItem.getFile();
              handleFileSelect(new DataTransfer().files);
              // Create a FileList-like object
              const dt = new DataTransfer();
              dt.items.add(file);
              handleFileSelect(dt.files);
            }
          }
        }}
        className={cn(
          "relative flex min-h-[200px] flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-all duration-200",
          isDragging
            ? "border-neutral-900 bg-neutral-50"
            : selectedFile
              ? "border-neutral-300 bg-neutral-50"
              : "border-neutral-300 bg-white hover:border-neutral-400 hover:bg-neutral-50",
        )}
      >
        {selectedFile ? (
          // File selected state
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-neutral-900">
              <svg
                className="h-7 w-7 text-white"
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
            <div>
              <p className="font-medium text-neutral-900">
                {selectedFile.name}
              </p>
              <p className="mt-1 text-sm text-neutral-500">
                {formatBytes(selectedFile.size)}
              </p>
            </div>
            <button
              type="button"
              onClick={handleClearFile}
              className="text-sm font-medium text-neutral-600 underline underline-offset-2 hover:text-neutral-900"
            >
              Remove file
            </button>
          </div>
        ) : (
          // Empty state
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-neutral-100">
              <svg
                className="h-7 w-7 text-neutral-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            <div>
              <Text slot="label" className="font-medium text-neutral-900">
                {isDragging
                  ? "Drop your CSV file here"
                  : "Drag and drop your CSV file"}
              </Text>
              <p className="mt-1 text-sm text-neutral-500">
                or click to browse • Max {formatBytes(MAX_FILE_SIZE)}
              </p>
            </div>
            <FileTrigger
              acceptedFileTypes={[".csv", "text/csv", "application/csv"]}
              onSelect={handleFileSelect}
            >
              <Button className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:ring-offset-2">
                Select File
              </Button>
            </FileTrigger>
          </div>
        )}
      </AriaDropZone>
    </div>
  );
}
