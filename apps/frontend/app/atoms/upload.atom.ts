/**
 * Upload Atoms
 */

import { Atom } from "@effect-atom/atom-react";
import type { TextTransform } from "@/app/types";

// ─────────────────────────────────────────────────────────────
// File State
// ─────────────────────────────────────────────────────────────

export const selectedFileAtom = Atom.make<File | null>(null).pipe(
  Atom.keepAlive,
);

// ─────────────────────────────────────────────────────────────
// Transform Selection
// ─────────────────────────────────────────────────────────────

export const textTransformAtom = Atom.make<TextTransform | null>(null).pipe(
  Atom.keepAlive,
);

// ─────────────────────────────────────────────────────────────
// Upload State
// ─────────────────────────────────────────────────────────────

export const isUploadingAtom = Atom.make(false).pipe(Atom.keepAlive);

export const uploadErrorAtom = Atom.make<string | null>(null).pipe(
  Atom.keepAlive,
);

// ─────────────────────────────────────────────────────────────
// Derived State
// ─────────────────────────────────────────────────────────────

export const canSubmitAtom = Atom.make((get) => {
  const file = get(selectedFileAtom);
  const transform = get(textTransformAtom);
  const isUploading = get(isUploadingAtom);

  return file !== null && transform !== null && !isUploading;
});

// ─────────────────────────────────────────────────────────────
// Reset Upload Form
// ─────────────────────────────────────────────────────────────

export function resetUploadForm(get: Atom.Context): void {
  get.set(selectedFileAtom, null);
  get.set(textTransformAtom, null);
  get.set(isUploadingAtom, false);
  get.set(uploadErrorAtom, null);
}
