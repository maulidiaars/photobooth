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

  /** Trimmed content box of frame.frame_png. */
  contentBox: FrameContentBox | null;

  /** Precomputed background-size/position for the current panel size. */
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
      {frame.slot_layout.map((rawRect, i) => {
        const photo = photos[i];
        const isActive = activeIndex === i;

        /*
          slot_layout coordinates are fractions of the FULL frame PNG.
          Convert them into the visible content box coordinates so the
          photo slots stay aligned with the cropped frame artwork.
        */
        const rect = contentBox
          ? remapSlotToContentBox(
              rawRect,
              contentBox.naturalWidth,
              contentBox.naturalHeight,
              contentBox.box
            )
          : rawRect;

        /*
          Position the photo using the exact same scale + offset used
          by the frame artwork itself.

          This is important because the preview panel can have a
          different size/aspect ratio depending on the device.
        */
        const style =
          previewLayout && contentBox
            ? {
                left: `${
                  previewLayout.offsetX +
                  rect.x * contentBox.box.w * previewLayout.scale
                }px`,
                top: `${
                  previewLayout.offsetY +
                  rect.y * contentBox.box.h * previewLayout.scale
                }px`,
                width: `${
                  rect.w * contentBox.box.w * previewLayout.scale
                }px`,
                height: `${
                  rect.h * contentBox.box.h * previewLayout.scale
                }px`,
              }
            : {
                left: `${rect.x * 100}%`,
                top: `${rect.y * 100}%`,
                width: `${rect.w * 100}%`,
                height: `${rect.h * 100}%`,
              };

        return (
          <div
            key={i}
            className="absolute z-0 overflow-hidden"
            style={style}
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
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 20,
                  }}
                  className="group relative block h-full w-full overflow-hidden disabled:cursor-default"
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
                    isActive
                      ? "ring-2 ring-garnet ring-inset"
                      : ""
                  }`}
                >
                  {isActive ? (
                    <motion.span
                      animate={{
                        opacity: [0.4, 1, 0.4],
                      }}
                      transition={{
                        duration: 1.1,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
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

      {/*
        ================================================================
        IMPORTANT:
        Frame artwork sekarang berada DI ATAS foto.

        Sebelumnya:
          FRAME
            ↓
          FOTO

        Itu membuat foto tampil sebagai kotak/persegi di atas frame.

        Sekarang:
          FOTO
            ↓
          FRAME PNG

        Karena lubang foto pada PNG frame bersifat transparan, foto hanya
        terlihat melalui lubang tersebut. Kalau lubangnya oval/rounded/
        bentuk lain, artwork frame otomatis menutup bagian foto yang
        berada di luar lubang.

        Ini membuat live camera preview mengikuti hasil merge di result.
        ================================================================
      */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-20"
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

      {slots.length === 0 && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-white">
          <p className="text-muted font-hand text-xl">
            frame tidak punya slot
          </p>
        </div>
      )}
    </div>
  );
}
