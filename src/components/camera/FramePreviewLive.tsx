"use client";

import { AnimatePresence, motion } from "framer-motion";
import { RotateCcw } from "lucide-react";
import type { Frame } from "@/types/frame";
import type { FrameContentBox } from "@/hooks/useFrameContentBox";
import type { FramePreviewLayout } from "@/hooks/useFramePreviewLayout";
import { remapSlotToContentBox } from "@/lib/frameSlotDetector";

interface FramePreviewLiveProps {
  frame: Frame;
  photos: string[];
  totalSlots: number;
  activeIndex: number | null;
  locked: boolean;
  onSlotClick: (index: number) => void;
  /** Trimmed content box of frame.frame_png (see useFrameContentBox) —
   *  used to crop the transparent PNG margin out of the rendered
   *  background and to remap slot_layout rects (which are fractions of
   *  the *full* PNG) into fractions of the visible content box. */
  contentBox: FrameContentBox | null;
  /** Precomputed background-size/position for the current panel size
   *  (see useFramePreviewLayout). Falls back to a plain `cover` render
   *  for the single frame before this is available. */
  previewLayout: FramePreviewLayout | null;
}

export function FramePreviewLive({
  frame,
  photos,
  totalSlots,
  activeIndex,
  locked,
  onSlotClick,
  contentBox,
  previewLayout,
}: FramePreviewLiveProps) {
  const slots = Array.from({ length: totalSlots });

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* frame_png as a precisely-cropped background: sized/positioned so
          the PNG's trimmed content box (its actual visible artwork) fills
          this box edge-to-edge, cropping out the transparent margin baked
          around it instead of leaving it as whitespace. Falls back to a
          plain `cover` for one frame before the panel's height is known. */}
      <div
        className="absolute inset-0"
        style={
          previewLayout
            ? {
                backgroundImage: `url(${frame.frame_png})`,
                backgroundSize: previewLayout.backgroundSize,
                backgroundPosition: previewLayout.backgroundPosition,
                backgroundRepeat: "no-repeat",
              }
            : {
                backgroundImage: `url(${frame.frame_png})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
              }
        }
      />

      {frame.slot_layout.map((rawRect, i) => {
        const photo = photos[i];
        const isActive = activeIndex === i;
        // slot_layout coordinates are fractions of the *full* frame_png
        // canvas; remap them into fractions of the trimmed content box so
        // they line up with the cropped background above instead of
        // drifting off by the size of the cropped-away margin.
        const rect = contentBox
          ? remapSlotToContentBox(rawRect, contentBox.naturalWidth, contentBox.naturalHeight, contentBox.box)
          : rawRect;

        return (
          <div
            key={i}
            className="absolute overflow-hidden"
            style={{
              left: `${rect.x * 100}%`,
              top: `${rect.y * 100}%`,
              width: `${rect.w * 100}%`,
              height: `${rect.h * 100}%`,
            }}
          >
            <AnimatePresence mode="wait">
              {photo ? (
                <motion.button
                  key={photo}
                  type="button"
                  onClick={() => {
                    if (!locked) {
                      onSlotClick(i);
                    }
                  }}
                  disabled={locked}
                  initial={{ opacity: 0, scale: 0.82 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="group relative block h-full w-full disabled:cursor-default overflow-hidden"
                  aria-label={`Foto ${i + 1} — klik untuk ambil ulang`}
                >
                  <img
                    src={photo}
                    alt={`Foto ${i + 1}`}
                    className="block h-full w-full object-cover object-center"
                  />

                  {!locked && (
                    <span className="absolute inset-0 flex items-center justify-center gap-1.5 bg-ink/0 font-body text-[11px] font-semibold text-white opacity-0 transition-all duration-150 group-hover:bg-ink/60 group-hover:opacity-100 sm:text-xs">
                      <RotateCcw size={13} strokeWidth={2.6} />
                      ambil ulang
                    </span>
                  )}
                </motion.button>
              ) : (
                <div
                  className={`flex h-full w-full items-center justify-center bg-white/35 transition-shadow ${
                    isActive ? "ring-2 ring-garnet ring-inset" : ""
                  }`}
                >
                  {isActive ? (
                    <motion.span
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
                      className="font-display text-sm font-semibold text-garnet sm:text-base"
                    >
                      {i + 1}
                    </motion.span>
                  ) : (
                    <span className="font-display text-sm font-semibold text-ink/20 sm:text-base">
                      {i + 1}
                    </span>
                  )}
                </div>
              )}
            </AnimatePresence>
          </div>
        );
      })}

      {slots.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-white">
          <p className="text-muted font-hand text-xl">frame tidak punya slot</p>
        </div>
      )}
    </div>
  );
}