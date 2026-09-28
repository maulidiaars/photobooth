"use client";

import Webcam from "react-webcam";
import type { RefObject } from "react";
import type { PhotoFilterId } from "@/lib/photoFilters";
import { getPhotoFilter } from "@/lib/photoFilters";

interface WebcamViewProps {
  webcamRef: RefObject<
    Webcam | null
  >;

  videoConstraints:
    MediaTrackConstraints;

  filter?: PhotoFilterId;

  captureAspectRatio?: number;
}

function getGuideSize(
  aspectRatio: number
) {
  const ratio =
    Number.isFinite(
      aspectRatio
    ) &&
    aspectRatio > 0
      ? aspectRatio
      : 4 / 5;

  /*
   * Guide memakai rasio slot ASLI.
   *
   * Kita batasi ukurannya supaya tetap
   * nyaman dilihat di dalam kamera.
   */
  const maxWidth = 82;
  const maxHeight = 76;

  let width =
    maxWidth;

  let height =
    width / ratio;

  /*
   * Kalau terlalu tinggi,
   * kecilkan berdasarkan tinggi.
   */
  if (
    height > maxHeight
  ) {
    height = maxHeight;
    width =
      height * ratio;
  }

  return {
    width: `${width}%`,
    height: `${height}%`,
  };
}

export function WebcamView({
  webcamRef,
  videoConstraints,
  filter = "original",
  captureAspectRatio = 4 / 5,
}: WebcamViewProps) {
  const selectedFilter =
    getPhotoFilter(
      filter
    );

  const filterStyle =
    selectedFilter.filter ===
    "none"
      ? "none"
      : selectedFilter.filter;

  const guide =
    getGuideSize(
      captureAspectRatio
    );

  return (
    <div className="absolute inset-0 overflow-hidden bg-black">
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
          mirrored
          screenshotFormat="image/jpeg"
          screenshotQuality={0.95}
          videoConstraints={
            videoConstraints
          }
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
      </div>

      <div className="pointer-events-none absolute inset-0 z-20">
        <div className="absolute inset-0 bg-black/25" />

        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{
            width: guide.width,
            height: guide.height,
          }}
        >
          <div className="absolute inset-0 rounded-[18px] border border-white/90 shadow-[0_0_0_1px_rgba(0,0,0,.12),0_0_30px_rgba(255,255,255,.08)] sm:rounded-[22px]" />

          <span className="absolute -left-px -top-px h-8 w-8 rounded-tl-[8px] border-l-[3px] border-t-[3px] border-white sm:h-10 sm:w-10" />

          <span className="absolute -right-px -top-px h-8 w-8 rounded-tr-[8px] border-r-[3px] border-t-[3px] border-white sm:h-10 sm:w-10" />

          <span className="absolute -bottom-px -left-px h-8 w-8 rounded-bl-[8px] border-b-[3px] border-l-[3px] border-white sm:h-10 sm:w-10" />

          <span className="absolute -bottom-px -right-px h-8 w-8 rounded-br-[8px] border-b-[3px] border-r-[3px] border-white sm:h-10 sm:w-10" />

          <div className="absolute left-1/2 top-3 -translate-x-1/2 rounded-full bg-black/45 px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-white/90 backdrop-blur-sm sm:top-4 sm:text-[10px]">
            AREA FOTO
          </div>
        </div>

        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/45 px-3 py-1 text-center text-[9px] font-medium tracking-wide text-white/80 backdrop-blur-sm sm:bottom-4 sm:text-[10px]">
          Yang ada di dalam kotak akan masuk ke frame
        </div>
      </div>
    </div>
  );
}
