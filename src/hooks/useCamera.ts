import { useCallback, useRef } from "react";
import Webcam from "react-webcam";
import type { PhotoFilterId } from "@/lib/photoFilters";
import { getPhotoFilter } from "@/lib/photoFilters";
import {
  computeFaceGeometry,
  drawFaceEffect,
  toMirroredPixelPoints,
  type FaceEffectId,
  type NormalizedPoint,
} from "@/lib/faceEffects";

const videoConstraints: MediaTrackConstraints = {
  width: 1280,
  height: 720,
  facingMode: "user",
};

export function useCamera() {
  const webcamRef = useRef<Webcam>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  /** Latest live-tracked face landmarks, written by WebcamView's AR loop
   *  and read here at capture time so the sticker sits on the face the
   *  same way it did a split-second earlier in the live preview. */
  const landmarksRef = useRef<NormalizedPoint[] | null>(null);

  const playShutterSound = useCallback(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio("/sounds/shutter.mp3");
    }
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(() => {});
  }, []);

  const capture = useCallback(
    async (filterId: PhotoFilterId = "original"): Promise<string | null> => {
      if (!webcamRef.current) return null;

      playShutterSound();

      const screenshot = webcamRef.current.getScreenshot();
      if (!screenshot) return null;

      const selected = getPhotoFilter(filterId);
      const isAR = selected.kind === "ar";

      // Fast path for a completely untouched photo.
      if (selected.filter === "none" && !isAR) {
        return screenshot;
      }

      return new Promise((resolve) => {
        const img = new Image();

        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = img.naturalWidth || img.width;
          canvas.height = img.naturalHeight || img.height;

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(screenshot);
            return;
          }

          ctx.filter = selected.filter === "none" ? "none" : selected.filter;
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          ctx.filter = "none";

          /*
            AR face-tracked accessory: baked in from the most recently
            tracked landmarks, using the same geometry math as the live
            preview, so it really is part of the photo — not just a
            fixed sticker glued to the middle of the frame.
          */
          if (isAR && landmarksRef.current) {
            const pts = toMirroredPixelPoints(
              landmarksRef.current,
              canvas.width,
              canvas.height
            );
            const geo = computeFaceGeometry(pts);
            if (geo) {
              drawFaceEffect(
                ctx,
                selected.id as FaceEffectId,
                geo,
                performance.now()
              );
            }
          }

          resolve(canvas.toDataURL("image/jpeg", 0.95));
        };

        img.onerror = () => resolve(screenshot);
        img.src = screenshot;
      });
    },
    [playShutterSound]
  );

  return {
    webcamRef,
    capture,
    videoConstraints,
    landmarksRef,
  };
}
