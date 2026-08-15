"use client";

import { useCallback, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { RotateCcw } from "lucide-react";
import type { Frame } from "@/types/frame";

interface FramePreviewLiveProps {
  frame: Frame;
  photos: string[];
  totalSlots: number;
  /** Slot currently armed to be shot next (auto sequence) or being
   *  re-shot (retake) — gets a pulsing garnet ring. */
  activeIndex: number | null;
  /** Ignore clicks on filled slots while a shot is in flight. */
  locked: boolean;
  onSlotClick: (index: number) => void;
  /** Fires with the ghost sizer's live rendered pixel width, so the
   *  parent page can size the column around it exactly instead of
   *  guessing via CSS. */
  onMeasure?: (width: number) => void;
}

/**
 * Renders the chosen frame's own PNG plus every captured photo dropped
 * exactly into that frame's real slot_layout holes — the same
 * coordinates canvas.ts uses for the final export — so what the person
 * sees here during the session is the actual finished strip building
 * itself up live, not a generic 3-box placeholder grid.
 */
export function FramePreviewLive({
  frame,
  photos,
  totalSlots,
  activeIndex,
  locked,
  onSlotClick,
  onMeasure,
}: FramePreviewLiveProps) {
  const slots = Array.from({ length: totalSlots });
  const roRef = useRef<ResizeObserver | null>(null);

  // Callback ref (not useEffect) so it re-attaches automatically every
  // time the ghost sizer <img> node itself changes, and reports the
  // element's real rendered width any time it changes size — frame
  // switch, window resize, breakpoint change, all covered for free.
  const ghostRef = useCallback(
    (node: HTMLImageElement | null) => {
      roRef.current?.disconnect();
      roRef.current = null;
      if (node && onMeasure) {
        const ro = new ResizeObserver((entries) => {
          const w = entries[0]?.contentRect.width;
          if (w) onMeasure(w);
        });
        ro.observe(node);
        roRef.current = ro;
      }
    },
    [onMeasure]
  );

  return (
    <div className="flex h-full min-h-0 w-full items-center justify-center">
      <div className="relative h-full min-h-0">
        {/* Ghost sizer: invisible, but its rendered box (height = 100%
            of the column, width = auto per the PNG's own intrinsic
            ratio) is what every slot's percentage position is measured
            against, so overlays land pixel-exact on the real artwork
            with zero JS measuring / no layout jump. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={ghostRef}
          src={frame.frame_png}
          alt=""
          aria-hidden
          className="invisible h-full w-auto max-w-full object-contain"
        />

        {/* Captured photos, clipped into their real holes, frame
            artwork drawn on top so its opaque design + transparent
            windows read exactly like the printed result. */}
        {frame.slot_layout.map((rect, i) => {
          const photo = photos[i];
          const isActive = activeIndex === i;
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
                    onClick={() => !locked && onSlotClick(i)}
                    disabled={locked}
                    initial={{ opacity: 0, scale: 0.82 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="group relative block h-full w-full disabled:cursor-default"
                    aria-label={`Foto ${i + 1} — klik untuk ambil ulang`}
                  >
                    {/* Scaled up a hair past 100% so sub-pixel rounding
                        between the slot rect and the frame artwork's
                        actual hole edge never shows as a hairline gap
                        or border — the photo always bleeds flush to
                        the frame, no seam. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo}
                      alt={`Foto ${i + 1}`}
                      className="h-full w-full scale-[1.02] object-cover"
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

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={frame.frame_png}
          alt={frame.nama}
          className="pointer-events-none absolute inset-0 z-10 h-full w-full object-contain"
        />

        {slots.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-muted font-hand text-xl">frame tidak punya slot</p>
          </div>
        )}
      </div>
    </div>
  );
}