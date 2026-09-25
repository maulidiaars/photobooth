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
  const filterStyle = getPhotoFilter(filter).filter;

  return (
    <Webcam
      ref={webcamRef}
      audio={false}
      mirrored
      screenshotFormat="image/jpeg"
      screenshotQuality={0.95}
      videoConstraints={videoConstraints}
      className="absolute inset-0 h-full w-full object-cover"
      style={{ filter: filterStyle === "none" ? undefined : filterStyle }}
    />
  );
}
