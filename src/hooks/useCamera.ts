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
      if (selected.filter === "none" && !selected.overlay) {
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

          ctx.filter =
            selected.filter === "none"
              ? "none"
              : selected.filter;

          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          ctx.filter = "none";

          /*
            Sticker/effect overlay:
            kept deliberately simple so it remains a real part of
            the captured photo instead of only being a live-preview UI.
          */
          if (selected.overlay) {
            const fontSize = Math.max(
              28,
              Math.round(canvas.width * 0.055)
            );

            ctx.save();
            ctx.font = `800 ${fontSize}px Arial`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillStyle = "rgba(255, 225, 235, 0.94)";
            ctx.shadowColor = "rgba(0,0,0,.3)";
            ctx.shadowBlur = Math.max(8, fontSize * 0.18);
            ctx.fillText(
              selected.overlay,
              canvas.width / 2,
              canvas.height * 0.42
            );
            ctx.restore();
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
  };
}
