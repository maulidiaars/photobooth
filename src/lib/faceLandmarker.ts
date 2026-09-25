/**
 * Loads Google's MediaPipe FaceLandmarker (client-side, in the browser).
 *
 * The WASM runtime and the model file are both fetched from a public CDN
 * at runtime instead of being bundled, so nothing needs to be added to
 * next.config.ts / webpack for this to work — it's a plain browser fetch,
 * cached by the browser after the first load.
 */
import type { FaceLandmarker as FaceLandmarkerInstance } from "@mediapipe/tasks-vision";

const WASM_BASE =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";

const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

let loaderPromise: Promise<FaceLandmarkerInstance> | null = null;

async function create(delegate: "GPU" | "CPU") {
  const { FilesetResolver, FaceLandmarker } = await import(
    "@mediapipe/tasks-vision"
  );

  const fileset = await FilesetResolver.forVisionTasks(WASM_BASE);

  return FaceLandmarker.createFromOptions(fileset, {
    baseOptions: {
      modelAssetPath: MODEL_URL,
      delegate,
    },
    runningMode: "VIDEO",
    numFaces: 1,
    outputFaceBlendshapes: false,
    outputFacialTransformationMatrixes: false,
  });
}

/** Cached singleton — the model only ever loads once per page session. */
export function loadFaceLandmarker(): Promise<FaceLandmarkerInstance> {
  if (!loaderPromise) {
    // Prefer the GPU delegate (faster, smoother tracking); fall back to
    // CPU on devices/browsers where WebGL-backed inference isn't available.
    loaderPromise = create("GPU").catch(() => create("CPU"));
  }
  return loaderPromise;
}
