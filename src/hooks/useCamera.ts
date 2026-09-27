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
      audioRef.current = new Audio(
        "/sounds/shutter.mp3"
      );
    }

    audioRef.current.currentTime = 0;

    audioRef.current.play().catch(() => {});
  }, []);

  const capture = useCallback(
    async (
      filterId: PhotoFilterId = "original",
      captureAspectRatio = 4 / 5
    ): Promise<string | null> => {
      if (!webcamRef.current) {
        return null;
      }

      playShutterSound();

      const screenshot =
        webcamRef.current.getScreenshot();

      if (!screenshot) {
        return null;
      }

      const selected =
        getPhotoFilter(filterId);

      /*
       * Screenshot webcam mentah selalu dicrop
       * ke rasio slot frame terlebih dahulu.
       *
       * Dengan begitu:
       *
       * AREA FOTO DI KAMERA
       *        =
       * AREA FOTO HASIL
       */
      return new Promise((resolve) => {
        const img = new Image();

        img.onload = () => {
          const sourceWidth =
            img.naturalWidth || img.width;

          const sourceHeight =
            img.naturalHeight || img.height;

          const safeRatio =
            Number.isFinite(
              captureAspectRatio
            ) &&
            captureAspectRatio > 0
              ? captureAspectRatio
              : 4 / 5;

          /*
           * Cari crop terbesar yang masih memiliki
           * aspect ratio yang sama dengan slot frame.
           */
          let cropWidth = sourceWidth;

          let cropHeight =
            sourceWidth / safeRatio;

          if (cropHeight > sourceHeight) {
            cropHeight = sourceHeight;
            cropWidth =
              sourceHeight * safeRatio;
          }

          /*
           * Crop selalu di tengah.
           *
           * Ini dibuat sama dengan posisi
           * framing guide di live camera.
           */
          const cropX =
            (sourceWidth - cropWidth) / 2;

          const cropY =
            (sourceHeight - cropHeight) / 2;

          const canvas =
            document.createElement("canvas");

          canvas.width = Math.max(
            1,
            Math.round(cropWidth)
          );

          canvas.height = Math.max(
            1,
            Math.round(cropHeight)
          );

          const ctx =
            canvas.getContext("2d");

          if (!ctx) {
            resolve(screenshot);
            return;
          }

          /*
           * Filter diterapkan langsung ketika
           * foto di-crop.
           */
          ctx.filter =
            selected.filter === "none"
              ? "none"
              : selected.filter;

          ctx.drawImage(
            img,
            cropX,
            cropY,
            cropWidth,
            cropHeight,
            0,
            0,
            canvas.width,
            canvas.height
          );

          ctx.filter = "none";

          resolve(
            canvas.toDataURL(
              "image/jpeg",
              0.95
            )
          );
        };

        img.onerror = () => {
          resolve(screenshot);
        };

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
