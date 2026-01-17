"use client";

import { useAtomValue, useAtomSet } from "@effect-atom/atom-react";
import { textTransformAtom } from "@/app/atoms";
import { cn } from "@/lib/utils";
import type { TextTransform } from "@/app/types";

interface TransformOption {
  value: TextTransform;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const transformOptions: TransformOption[] = [
  {
    value: "uppercase",
    label: "Uppercase",
    description: "Convert all text to UPPERCASE",
    icon: (
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
          d="M4 6h16M4 12h16m-7 6h7"
        />
      </svg>
    ),
  },
  {
    value: "lowercase",
    label: "Lowercase",
    description: "Convert all text to lowercase",
    icon: (
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
          d="M4 6h16M4 12h8m-8 6h16"
        />
      </svg>
    ),
  },
];

export function TransformSelector() {
  const selectedTransform = useAtomValue(textTransformAtom);
  const setSelectedTransform = useAtomSet(textTransformAtom);

  return (
    <div className="space-y-3">
      <div>
        <label className="text-sm font-medium text-neutral-900">
          Text Transform <span className="text-red-500">*</span>
        </label>
        <p className="mt-1 text-sm text-neutral-500">
          Choose how to transform the text in your CSV file
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {transformOptions.map((option) => {
          const isSelected = selectedTransform === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setSelectedTransform(option.value)}
              className={cn(
                "flex flex-col items-start gap-2 rounded-xl border-2 p-4 text-left transition-all duration-200",
                isSelected
                  ? "border-neutral-900 bg-neutral-50 ring-1 ring-neutral-900"
                  : "border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50",
              )}
            >
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
                  isSelected
                    ? "bg-neutral-900 text-white"
                    : "bg-neutral-100 text-neutral-500",
                )}
              >
                {option.icon}
              </div>
              <div>
                <p
                  className={cn(
                    "font-medium",
                    isSelected ? "text-neutral-900" : "text-neutral-700",
                  )}
                >
                  {option.label}
                </p>
                <p className="mt-0.5 text-sm text-neutral-500">
                  {option.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
