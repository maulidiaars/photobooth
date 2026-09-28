"use client";

import {
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
  computeGuideRect,
} from "@/lib/canvas";

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
}

export function WebcamView({
  webcamRef,
  videoConstraints,
  filter = "original",
  captureAspectRatio = null,
}: WebcamViewProps) {
  const containerRef =
    useRef<HTMLDivElement>(
      null
    );

  const [
    containerSize,
    setContainerSize,
  ] = useState<{ w: number; h: number } | null>(null);

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
          transition:
            "filter 180ms ease, -webkit-filter 180ms ease",
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

            <div className="absolute left-1/2 top-3 -translate-x-1/2 rounded-full bg-black/45 px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-white/90 backdrop-blur-sm sm:top-4 sm:text-[10px]">
              AREA FOTO
            </div>
          </div>
        )}

        <div className="absolute left-1/2 top-2 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/45 px-3 py-1 text-center text-[9px] font-medium tracking-wide text-white/80 backdrop-blur-sm sm:text-[10px]">
          Yang ada di dalam kotak akan masuk ke frame
        </div>
      </div>
    </div>
  );
}
