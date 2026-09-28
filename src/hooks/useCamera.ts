import {
  useCallback,
  useRef,
} from "react";
import Webcam from "react-webcam";
import type { PhotoFilterId } from "@/lib/photoFilters";
import { getPhotoFilter } from "@/lib/photoFilters";
import {
  CAMERA_PREVIEW_MIRRORED,
  computeSourceCrop,
} from "@/lib/canvas";

const videoConstraints: MediaTrackConstraints =
  {
    width: 1280,
    height: 720,
    facingMode: "user",
  };

export function useCamera() {
  const webcamRef =
    useRef<Webcam>(null);

  const audioRef =
    useRef<HTMLAudioElement | null>(
      null
    );

  const playShutterSound =
    useCallback(() => {
      if (!audioRef.current) {
        audioRef.current =
          new Audio(
            "/sounds/shutter.mp3"
          );
      }

      audioRef.current.currentTime =
        0;

      audioRef.current
        .play()
        .catch(() => {});
    }, []);

  /*
   * ============================================================
   * CAPTURE — WHAT YOU SEE = WHAT YOU GET
   * ============================================================
   *
   * `captureAspectRatio` adalah rasio PIKSEL asli dari lubang foto
   * frame yang sedang dipilih (lebar / tinggi).
   *
   * Alurnya:
   *
   *   VIDEO SUMBER (piksel asli kamera)
   *        ↓
   *   crop persis area guide  (computeSourceCrop — fungsi yang sama
   *                            dengan yang menggambar guide)
   *        ↓
   *   CANVAS (rasio = rasio lubang frame, tanpa stretch)
   *        ↓
   *   FILTER
   *        ↓
   *   FOTO FINAL → masuk ke lubang frame tanpa crop tambahan
   */
  const capture =
    useCallback(
      async (
        filterId: PhotoFilterId =
          "original",
        captureAspectRatio: number
      ): Promise
        string | null
      > => {
        const video =
          webcamRef.current
            ?.video;

        if (!video) {
          return null;
        }

        /*
         * Video belum punya frame / dimensi
         * -> jangan capture (hasilnya hitam / salah crop).
         */
        if (
          video.readyState < 2 ||
          !video.videoWidth ||
          !video.videoHeight
        ) {
          return null;
        }

        if (
          !Number.isFinite(
            captureAspectRatio
          ) ||
          captureAspectRatio <= 0
        ) {
          return null;
        }

        /*
         * Ukuran container preview = ukuran elemen <video>
         * (absolute inset-0). Guide di WebcamView dihitung dari
         * ukuran yang sama dengan fungsi yang sama.
         */
        const crop =
          computeSourceCrop({
            containerWidth:
              video.clientWidth,
            containerHeight:
              video.clientHeight,
            videoWidth:
              video.videoWidth,
            videoHeight:
              video.videoHeight,
            ratio:
              captureAspectRatio,
            mirrored:
              CAMERA_PREVIEW_MIRRORED,
          });

        if (!crop) {
          return null;
        }

        playShutterSound();

        /*
         * Canvas output selalu berukuran sesuai crop dan rasio
         * lubang frame. Tidak ada width/height arbitrer, jadi
         * foto tidak gepeng / melar.
         */
        const outWidth =
          Math.max(
            1,
            Math.round(
              crop.w
            )
          );

        const outHeight =
          Math.max(
            1,
            Math.round(
              outWidth /
                captureAspectRatio
            )
          );

        const canvas =
          document.createElement(
            "canvas"
          );

        canvas.width =
          outWidth;

        canvas.height =
          outHeight;

        const ctx =
          canvas.getContext(
            "2d"
          );

        if (!ctx) {
          return null;
        }

        const selected =
          getPhotoFilter(
            filterId
          );

        ctx.filter =
          selected.filter ===
          "none"
            ? "none"
            : selected.filter;

        /*
         * Preview di-mirror lewat CSS (scaleX(-1)). Crop di atas
         * sudah dihitung pada video mentah (tidak ter-mirror),
         * jadi hasil digambar dibalik horizontal supaya tampilannya
         * persis sama dengan preview.
         */
        if (
          CAMERA_PREVIEW_MIRRORED
        ) {
          ctx.translate(
            outWidth,
            0
          );

          ctx.scale(
            -1,
            1
          );
        }

        ctx.drawImage(
          video,
          crop.x,
          crop.y,
          crop.w,
          crop.h,
          0,
          0,
          outWidth,
          outHeight
        );

        ctx.setTransform(
          1,
          0,
          0,
          1,
          0,
          0
        );

        ctx.filter =
          "none";

        return canvas.toDataURL(
          "image/jpeg",
          0.95
        );
      },
      [playShutterSound]
    );

  return {
    webcamRef,
    capture,
    videoConstraints,
  };
}
