"use client";

import Webcam from "react-webcam";
import { useCallback } from "react";
import type { RefObject } from "react";
import type { PhotoFilterId } from "@/lib/photoFilters";
import { getPhotoFilter } from "@/lib/photoFilters";
import type { FaceEffectId, NormalizedPoint } from "@/lib/faceEffects";
import { useFaceAR } from "@/hooks/useFaceAR";

interface WebcamViewProps {
  webcamRef: RefObject<Webcam | null>;
  videoConstraints: MediaTrackConstraints;
  filter?: PhotoFilterId;
  /** Latest tracked face landmarks, shared with useCamera so the same
   *  face position gets baked into the captured photo. */
  landmarksRef: RefObject<NormalizedPoint[] | null>;
}

export function WebcamView({
  webcamRef,
  videoConstraints,
  filter = "original",
  landmarksRef,
}: WebcamViewProps) {
  const selected = getPhotoFilter(filter);
  const filterStyle = selected.filter;
  const isAR = selected.kind === "ar";

  const getVideo = useCallback(
    () => webcamRef.current?.video ?? null,
    [webcamRef]
  );

  const { canvasRef } = useFaceAR({
    active: isAR,
    effectId: isAR ? (selected.id as FaceEffectId) : null,
    getVideo,
    landmarksOutRef: landmarksRef,
  });

  return (
    <div className="absolute inset-0 overflow-hidden">
      <Webcam
        ref={webcamRef}
        audio={false}
        mirrored
        screenshotFormat="image/jpeg"
        screenshotQuality={0.95}
        videoConstraints={videoConstraints}
        className="absolute inset-0 h-full w-full object-cover"
        style={{
          filter: filterStyle === "none" ? undefined : filterStyle,
        }}
      />

      {isAR && (
        <canvas
          ref={canvasRef}
          className="pointer-events-none absolute inset-0 z-10 h-full w-full object-cover"
          aria-hidden="true"
        />
      )}
    </div>
  );
}
