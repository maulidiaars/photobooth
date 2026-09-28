import {
  useCallback,
  useRef,
} from "react";
import Webcam from "react-webcam";
import type { PhotoFilterId } from "@/lib/photoFilters";
import {
  applyCssFilterFallback,
  canvasSupportsNativeFilter,
  getPhotoFilter,
} from "@/lib/photoFilters";
import {
  CAMERA_PREVIEW_MIRRORED,
  computeSourceCrop,
} from "@/lib/canvas";
import { getZoomState } from "@/lib/cameraZoom";

/*
 * Minta resolusi HD (Full HD 1920x1080). Kalau kamera tidak
 * sanggup, browser otomatis turun ke resolusi tertinggi yang ada.
 */
const videoConstraints: MediaTrackConstraints =
  {
    width: { ideal: 1920 },
    height: { ideal: 1080 },
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
   *   crop persis area guide (computeSourceCrop — fungsi yang sama
   *                           dengan yang menggambar guide)
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
      ): Promise<string | null> => {
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
         * Skala digital dari WebcamView (MODE VIRTUAL: 1x = 1,
         * 0.5x <= 1 = menjauh). Kamera dengan hardware wide /
         * Ultra Wide selalu 1 di sini. Dipakai supaya crop capture
         * persis sama dengan yang terlihat di preview.
         */
        const digitalZoom =
          getZoomState().digital;

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
            zoomFactor:
              digitalZoom,
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

        /*
         * Filter dipanggang LANGSUNG ke piksel foto.
         *
         * Browser yang mendukung `ctx.filter` (Chrome, Firefox,
         * Edge) memakainya langsung. Safari / iPad / iPhone TIDAK
         * mendukung `ctx.filter` -> di sana filter dihitung manual
         * per-piksel (applyCssFilterFallback) setelah foto digambar,
         * supaya filter tetap menyatu dengan foto & ikut ke hasil
         * akhir.
         */
        const nativeFilter =
          canvasSupportsNativeFilter();

        ctx.imageSmoothingEnabled =
          true;

        ctx.imageSmoothingQuality =
          "high";

        ctx.filter =
          nativeFilter &&
          selected.filter !==
            "none"
            ? selected.filter
            : "none";

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

        if (
          !nativeFilter &&
          selected.filter !==
            "none"
        ) {
          applyCssFilterFallback(
            ctx,
            outWidth,
            outHeight,
            selected.filter
          );
        }

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
