/**
 * Effect Atom Runtime
 */

import { Atom } from "@effect-atom/atom-react";
import { Layer } from "effect";

/**
 * Base runtime for the application
 * Can be extended with services/layers as needed
 */
export const appRuntime = Atom.runtime(Layer.empty);
