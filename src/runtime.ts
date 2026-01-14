/**
 * Application Runtime
 */

import { Layer, ManagedRuntime } from "effect";
import { NodeFileSystem } from "@effect/platform-node";
import { JobStore } from "./services/job-store.service.js";
import { JobProgress } from "./services/job-progress.service.js";

const BaseLayers = Layer.mergeAll(NodeFileSystem.layer);

const StateLayers = Layer.mergeAll(JobStore.Default, JobProgress.Default);

const coreLayers = Layer.mergeAll(BaseLayers, StateLayers);

export const AppLayer = Layer.mergeAll(coreLayers);

export function makeAppRuntime() {
  return ManagedRuntime.make(AppLayer);
}

export type AppRuntime = ReturnType<typeof makeAppRuntime>;
