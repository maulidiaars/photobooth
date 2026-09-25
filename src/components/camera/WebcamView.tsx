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
  const selected = getPhotoFilter(filter);
  const filterStyle = selected.filter;

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

      {selected.overlay && (
        <div
          className={`pointer-events-none absolute inset-0 z-10 flex items-center justify-center overflow-hidden ${
            selected.overlayClass ?? ""
          }`}
          aria-hidden="true"
        >
          <div className="photo-effect-overlay w-full px-5 text-center">
            {selected.overlay}
          </div>
        </div>
      )}

      <style jsx>{`
        .photo-effect-overlay {
          font-family:
            "Arial Rounded MT Bold",
            "Trebuchet MS",
            system-ui,
            sans-serif;
          font-weight: 800;
          letter-spacing: 0.08em;
          line-height: 1.2;
          text-shadow:
            0 2px 12px rgba(0, 0, 0, 0.32),
            0 0 18px rgba(255, 255, 255, 0.3);
          opacity: 0.9;
          transform: translateY(-2%);
        }

        .love .photo-effect-overlay {
          color: rgba(255, 207, 220, 0.95);
          font-size: clamp(42px, 7vw, 86px);
          letter-spacing: 0.28em;
          animation: loveFloat 3.2s ease-in-out infinite;
        }

        .hearts .photo-effect-overlay {
          color: rgba(255, 107, 137, 0.92);
          font-size: clamp(34px, 6vw, 72px);
          letter-spacing: 0.2em;
          animation: heartFloat 2.8s ease-in-out infinite;
        }

        .dreamy .photo-effect-overlay {
          color: rgba(255, 244, 255, 0.95);
          font-size: clamp(36px, 6vw, 76px);
          letter-spacing: 0.25em;
          animation: dreamy 3.8s ease-in-out infinite;
        }

        .sparkle .photo-effect-overlay {
          color: rgba(255, 244, 178, 0.98);
          font-size: clamp(38px, 6vw, 78px);
          letter-spacing: 0.24em;
          animation: sparkle 2.4s ease-in-out infinite;
        }

        .sweet .photo-effect-overlay {
          color: rgba(255, 238, 238, 0.96);
          font-size: clamp(28px, 5vw, 64px);
          letter-spacing: 0.16em;
          animation: sweet 3s ease-in-out infinite;
        }

        .retro-pop .photo-effect-overlay {
          color: #fff6a7;
          font-size: clamp(25px, 4vw, 54px);
          letter-spacing: 0.2em;
          transform: rotate(-4deg);
          text-shadow:
            3px 3px 0 rgba(209, 49, 74, 0.8),
            0 0 16px rgba(255, 255, 255, 0.35);
        }

        .date-night .photo-effect-overlay {
          color: rgba(255, 215, 225, 0.96);
          font-family: Georgia, serif;
          font-size: clamp(23px, 4vw, 52px);
          letter-spacing: 0.16em;
          font-style: italic;
          animation: dateNight 3.5s ease-in-out infinite;
        }

        @keyframes loveFloat {
          0%, 100% { transform: translateY(-5%) scale(1); }
          50% { transform: translateY(-8%) scale(1.035); }
        }

        @keyframes heartFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-7px); }
        }

        @keyframes dreamy {
          0%, 100% { opacity: 0.72; transform: translateY(-2%) scale(.98); }
          50% { opacity: 1; transform: translateY(-4%) scale(1.03); }
        }

        @keyframes sparkle {
          0%, 100% { opacity: 0.55; transform: scale(.96) rotate(-2deg); }
          50% { opacity: 1; transform: scale(1.06) rotate(2deg); }
        }

        @keyframes sweet {
          0%, 100% { transform: translateY(-2%); }
          50% { transform: translateY(-7%) rotate(-1deg); }
        }

        @keyframes dateNight {
          0%, 100% { opacity: .7; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
