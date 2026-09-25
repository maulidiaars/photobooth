"use client";

import Webcam from "react-webcam";
import type { RefObject } from "react";
import type { PhotoFilterId } from "@/lib/photoFilters";
import { getPhotoFilter } from "@/lib/photoFilters";

interface WebcamViewProps {
  webcamRef: RefObject<Webcam | null>;
  videoConstraints: MediaTrackConstraints;
  filter?: PhotoFilterId;
}

export function WebcamView({
  webcamRef,
  videoConstraints,
  filter = "original",
}: WebcamViewProps) {
  const selectedFilter =
    getPhotoFilter(filter);

  const filterStyle =
    selectedFilter.filter === "none"
      ? "none"
      : selectedFilter.filter;

  return (
    <div className="absolute inset-0 overflow-hidden bg-black">
      {/*
        IMPORTANT:
        The filter is applied to the wrapper instead of
        the react-webcam component itself.

        So whenever `filter` changes:
        
        Original
           ↓
        Warm
           ↓
        B&W
           ↓
        Vintage
        
        the entire live camera preview changes immediately.
      */}
      <div
        className="absolute inset-0 h-full w-full"
        style={{
          filter: filterStyle,
          WebkitFilter: filterStyle,
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
          videoConstraints={videoConstraints}
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>
    </div>
  );
}
