"use client";

import Webcam from "react-webcam";
import type { RefObject } from "react";

interface WebcamViewProps {
  webcamRef: RefObject<Webcam | null>;
  videoConstraints: MediaTrackConstraints;
}

export function WebcamView({ webcamRef, videoConstraints }: WebcamViewProps) {
  return (
    <Webcam
      ref={webcamRef}
      audio={false}
      mirrored
      screenshotFormat="image/jpeg"
      screenshotQuality={0.95}
      videoConstraints={videoConstraints}
      className="absolute inset-0 h-full w-full object-cover"
    />
  );
}
