import { useCallback, useRef } from "react";
import Webcam from "react-webcam";
import type { PhotoFilterId } from "@/lib/photoFilters";
import { getPhotoFilter } from "@/lib/photoFilters";

const videoConstraints: MediaTrackConstraints = {
  width: 1280,
  height: 720,
  facingMode: "user",
};

export function useCamera() {
  const webcamRef = useRef<Webcam>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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

      // Fast path for a completely untouched photo.
      if (selected.filter === "none") {
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

          ctx.filter = selected.filter;
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          ctx.filter = "none";

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
  };
}
