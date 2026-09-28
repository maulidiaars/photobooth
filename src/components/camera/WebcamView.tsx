"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import Webcam from "react-webcam";
import type { PhotoFilterId } from "@/lib/photoFilters";
import { getPhotoFilter } from "@/lib/photoFilters";
import {
  CAMERA_PREVIEW_MIRRORED,
  computeDigitalZoomFactor,
  computeGuideRect,
} from "@/lib/canvas";
import {
  ZOOM_LEVELS,
  applyCameraZoom,
  resetZoomState,
  type ZoomLevel,
} from "@/lib/cameraZoom";

interface WebcamViewProps {
  webcamRef: RefObject<Webcam | null>;

  videoConstraints:
    MediaTrackConstraints;

  filter?: PhotoFilterId;

  /**
   * Rasio PIKSEL (lebar / tinggi) dari lubang foto frame yang
   * sedang dipilih. Guide dan hasil capture memakai rasio ini.
   * null = belum diketahui (frame masih dianalisis).
   */
  captureAspectRatio?: number | null;

  /** Kunci tombol zoom (mis. saat countdown / sedang memotret). */
  zoomDisabled?: boolean;
}

export function WebcamView({
  webcamRef,
  videoConstraints,
  filter = "original",
  captureAspectRatio = null,
  zoomDisabled = false,
}: WebcamViewProps) {
  const containerRef =
    useRef<HTMLDivElement>(
      null
    );

  const [
    containerSize,
    setContainerSize,
  ] = useState<{ w: number; h: number } | null>(null);

  const [
    videoSize,
    setVideoSize,
  ] = useState<{ w: number; h: number } | null>(null);

  const [zoom, setZoom] =
    useState<ZoomLevel>(1);

  const zoomRef =
    useRef<ZoomLevel>(1);

  const [
    hardwareWide,
    setHardwareWide,
  ] = useState(false);

  /*
   * Reset status zoom setiap halaman kamera dibuka, supaya tidak
   * "nyangkut" di 0.5x dari sesi sebelumnya.
   */
  useEffect(() => {
    resetZoomState();
  }, []);

  /*
   * Ukur container kamera (responsive). Guide dihitung dalam
   * PIKSEL dari ukuran ini — persis sama dengan yang dipakai
   * saat capture (video.clientWidth / clientHeight).
   */
  useEffect(() => {
    const el =
      containerRef.current;

    if (!el) {
      return;
    }

    const update = () => {
      const w =
        el.clientWidth;

      const h =
        el.clientHeight;

      setContainerSize(
        (prev) =>
          prev &&
          prev.w === w &&
          prev.h === h
            ? prev
            : { w, h }
      );
    };

    update();

    const observer =
      new ResizeObserver(
        update
      );

    observer.observe(el);

    return () =>
      observer.disconnect();
  }, []);

  const syncVideoSize =
    useCallback(() => {
      const v =
        webcamRef.current
          ?.video;

      if (
        v &&
        v.videoWidth > 0 &&
        v.videoHeight > 0
      ) {
        setVideoSize(
          (prev) =>
            prev &&
            prev.w ===
              v.videoWidth &&
            prev.h ===
              v.videoHeight
              ? prev
              : {
                  w: v.videoWidth,
                  h: v.videoHeight,
                }
        );
      }
    }, [webcamRef]);

  const handleUserMedia =
    useCallback(
      (stream: MediaStream) => {
        syncVideoSize();

        applyCameraZoom(
          stream,
          zoomRef.current
        ).then(setHardwareWide);
      },
      [syncVideoSize]
    );

  const handleZoomChange =
    async (level: ZoomLevel) => {
      if (
        zoomDisabled ||
        level === zoom
      ) {
        return;
      }

      zoomRef.current = level;

      setZoom(level);

      const hw =
        await applyCameraZoom(
          webcamRef.current
            ?.stream,
          level
        );

      setHardwareWide(hw);
    };

  const selectedFilter =
    getPhotoFilter(
      filter
    );

  const filterStyle =
    selectedFilter.filter ===
    "none"
      ? "none"
      : selectedFilter.filter;

  const hasValidRatio =
    typeof captureAspectRatio ===
      "number" &&
    Number.isFinite(
      captureAspectRatio
    ) &&
    captureAspectRatio > 0;

  const guide =
    containerSize &&
    containerSize.w > 0 &&
    containerSize.h > 0 &&
    hasValidRatio
      ? computeGuideRect(
          containerSize.w,
          containerSize.h,
          captureAspectRatio as number
        )
      : null;

  /*
   * Pelebaran digital untuk 0.5x (hanya dipakai kalau kamera tidak
   * punya zoom hardware di bawah 1x). Rumus yang SAMA dipakai
   * saat capture.
   */
  const digitalZoom =
    containerSize &&
    videoSize &&
    hasValidRatio
      ? computeDigitalZoomFactor({
          containerWidth:
            containerSize.w,
          containerHeight:
            containerSize.h,
          videoWidth:
            videoSize.w,
          videoHeight:
            videoSize.h,
          ratio:
            captureAspectRatio as number,
          zoom,
          hardware:
            hardwareWide,
        })
      : 1;

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden bg-black"
    >
      <div
        className="absolute inset-0 h-full w-full"
        style={{
          filter:
            filterStyle,
          WebkitFilter:
            filterStyle,
          transform: `scale(${digitalZoom})`,
          transformOrigin:
            "center center",
          transition:
            "filter 180ms ease, -webkit-filter 180ms ease, transform 260ms ease",
        }}
      >
        <Webcam
          ref={webcamRef}
          audio={false}
          mirrored={
            CAMERA_PREVIEW_MIRRORED
          }
          screenshotFormat="image/jpeg"
          screenshotQuality={0.95}
          videoConstraints={
            videoConstraints
          }
          onUserMedia={
            handleUserMedia
          }
          onLoadedMetadata={
            syncVideoSize
          }
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
      </div>

      <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
        {guide && (
          <div
            className="absolute"
            style={{
              left: `${guide.x}px`,
              top: `${guide.y}px`,
              width: `${guide.w}px`,
              height: `${guide.h}px`,
              /*
               * Area di LUAR guide digelapkan. Hanya area terang
               * di dalam guide yang akan masuk ke frame.
               */
              boxShadow:
                "0 0 0 9999px rgba(0,0,0,0.5)",
            }}
          >
            <div className="absolute inset-0 rounded-[4px] border border-white/90 shadow-[0_0_0_1px_rgba(0,0,0,.12)]" />

            <span className="absolute -left-px -top-px h-8 w-8 rounded-tl-[4px] border-l-[3px] border-t-[3px] border-white sm:h-10 sm:w-10" />

            <span className="absolute -right-px -top-px h-8 w-8 rounded-tr-[4px] border-r-[3px] border-t-[3px] border-white sm:h-10 sm:w-10" />

            <span className="absolute -bottom-px -left-px h-8 w-8 rounded-bl-[4px] border-b-[3px] border-l-[3px] border-white sm:h-10 sm:w-10" />

            <span className="absolute -bottom-px -right-px h-8 w-8 rounded-br-[4px] border-b-[3px] border-r-[3px] border-white sm:h-10 sm:w-10" />
          </div>
        )}
      </div>

      {/* Tombol zoom 0.5x / 1x */}
      <div className="absolute left-1/2 top-3 z-30 flex -translate-x-1/2 items-center gap-1 rounded-full bg-black/40 p-1 backdrop-blur-md sm:top-4">
        {ZOOM_LEVELS.map(
          (level) => {
            const active =
              zoom === level;

            return (
              <button
                key={level}
                type="button"
                disabled={
                  zoomDisabled
                }
                onClick={() =>
                  handleZoomChange(
                    level
                  )
                }
                aria-label={`Zoom ${level}x`}
                aria-pressed={
                  active
                }
                className={`flex h-8 min-w-8 items-center justify-center rounded-full px-2.5 text-[11px] font-bold tracking-wide transition-all disabled:cursor-not-allowed disabled:opacity-50 sm:h-9 sm:min-w-9 sm:text-xs ${
                  active
                    ? "bg-white text-[#4A1A1A] shadow-md"
                    : "text-white/85 hover:bg-white/15"
                }`}
              >
                {level}x
              </button>
            );
          }
        )}
      </div>
    </div>
  );
}
