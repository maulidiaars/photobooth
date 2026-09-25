"use client";

import { useEffect, useRef } from "react";
import type { RefObject } from "react";
import { loadFaceLandmarker } from "@/lib/faceLandmarker";
import {
  computeFaceGeometry,
  drawFaceEffect,
  toMirroredPixelPoints,
  type FaceEffectId,
  type NormalizedPoint,
} from "@/lib/faceEffects";

interface UseFaceAROptions {
  /** Only run detection + drawing while an AR filter is actually selected. */
  active: boolean;
  effectId: FaceEffectId | null;
  getVideo: () => HTMLVideoElement | null;
  /**
   * Shared with useCamera so the exact same landmarks used for the last
   * live-preview frame can be baked into the final captured photo.
   */
  landmarksOutRef: RefObject<NormalizedPoint[] | null>;
}

const MIN_FRAME_GAP_MS = 33; // ~30fps detection, plenty smooth for AR stickers

export function useFaceAR({
  active,
  effectId,
  getVideo,
  landmarksOutRef,
}: UseFaceAROptions) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const effectIdRef = useRef<FaceEffectId | null>(effectId);

  useEffect(() => {
    effectIdRef.current = effectId;
  }, [effectId]);

  useEffect(() => {
    if (!active) return;

    let cancelled = false;
    let rafId = 0;
    let lastTs = 0;

    (async () => {
      let landmarker;
      try {
        landmarker = await loadFaceLandmarker();
      } catch {
        return;
      }
      if (cancelled) return;

      const loop = () => {
        if (cancelled) return;

        const video = getVideo();
        const canvas = canvasRef.current;

        if (video && canvas && video.readyState >= 2 && video.videoWidth) {
          if (
            canvas.width !== video.videoWidth ||
            canvas.height !== video.videoHeight
          ) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
          }

          const now = performance.now();

          if (now - lastTs >= MIN_FRAME_GAP_MS) {
            lastTs = now;

            try {
              const result = landmarker.detectForVideo(video, now);
              const raw = result.faceLandmarks?.[0] ?? null;
              landmarksOutRef.current = raw as NormalizedPoint[] | null;

              const ctx = canvas.getContext("2d");
              if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);

                const currentEffect = effectIdRef.current;
                if (raw && currentEffect) {
                  const pts = toMirroredPixelPoints(
                    raw,
                    canvas.width,
                    canvas.height
                  );
                  const geo = computeFaceGeometry(pts);
                  if (geo) drawFaceEffect(ctx, currentEffect, geo, now);
                }
              }
            } catch {
              // A single bad frame shouldn't kill the whole loop.
            }
          }
        }

        rafId = requestAnimationFrame(loop);
      };

      rafId = requestAnimationFrame(loop);
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [active, getVideo, landmarksOutRef]);

  return { canvasRef };
}
