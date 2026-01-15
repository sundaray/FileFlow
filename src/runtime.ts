/**
 * Application Runtime
 */

import { Layer, ManagedRuntime } from "effect";
import { NodeFileSystem } from "@effect/platform-node";
import { JobStore } from "./services/job-store.service.js";
import { JobProgress } from "./services/job-progress.service.js";
import { Config } from "./services/config.service.js";
import { PipelineProcessor } from "./services/pipeline/index.js";
import { FileStream } from "./services/file-stream.service.js";

const BaseLayers = Layer.mergeAll(Config.Default, NodeFileSystem.layer);

const StateLayers = Layer.mergeAll(JobStore.Default, JobProgress.Default);

const ServiceLayers = Layer.mergeAll(
  PipelineProcessor.Default,
  FileStream.Default
);
const coreLayers = Layer.mergeAll(BaseLayers, StateLayers, ServiceLayers);

export const AppLayer = Layer.mergeAll(coreLayers);

export function makeAppRuntime() {
  return ManagedRuntime.make(AppLayer);
}

export type AppRuntime = ReturnType<typeof makeAppRuntime>;
