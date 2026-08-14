"use client";

import { motion } from "framer-motion";
import { RotateCcw } from "lucide-react";

interface SlotThumbnailsGridProps {
  total: number;
  photos: string[];
  onRetake?: (index: number) => void;
  retakeIndex?: number | null;
  disabled?: boolean;
}

/**
 * Each filled slot doubles as its own "retake" control: hover it and a
 * dark overlay with "Ambil ulang" fades in, click to re-shoot straight
 * into that exact hole. This replaces a separate "ulangi foto
 * terakhir" link — retaking is always scoped to the photo you're
 * actually pointing at, not just whichever one happened last.
 */
export function SlotThumbnailsGrid({
  total,
  photos,
  onRetake,
  retakeIndex = null,
  disabled = false,
}: SlotThumbnailsGridProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {Array.from({ length: total }).map((_, i) => {
        const photo = photos[i];
        const filled = Boolean(photo);
        const isRetaking = retakeIndex === i;
        return (
          <div key={i}>
            <div
              className={`group relative aspect-[16/10] overflow-hidden rounded-clay-sm shadow-clay-inset transition-colors ${
                filled ? "bg-white" : "bg-white/50"
              } ${isRetaking ? "ring-2 ring-garnet ring-offset-2 ring-offset-clay-gradient" : ""}`}
            >
              {photo ? (
                <>
                  <motion.img
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: "spring", stiffness: 260, damping: 20 }}
                    src={photo}
                    alt={`Foto ${i + 1}`}
                    className="h-full w-full object-cover"
                  />
                  {onRetake && (
                    <button
                      type="button"
                      onClick={() => onRetake(i)}
                      disabled={disabled}
                      aria-label={`Ambil ulang foto ${i + 1}`}
                      className="absolute inset-0 flex items-center justify-center gap-1.5 bg-ink/0 font-body text-xs font-semibold text-white opacity-0 transition-all duration-150 hover:bg-ink/65 hover:opacity-100 focus-visible:bg-ink/65 focus-visible:opacity-100 disabled:pointer-events-none"
                    >
                      <RotateCcw size={14} strokeWidth={2.4} />
                      Ambil ulang
                    </button>
                  )}
                  {isRetaking && (
                    <span className="absolute inset-0 flex items-center justify-center bg-garnet/40 font-body text-xs font-semibold text-white">
                      Bersiap...
                    </span>
                  )}
                </>
              ) : (
                <div className="flex h-full w-full items-center justify-center border-2 border-dashed border-garnet/25">
                  <span className="font-display text-base font-semibold text-garnet/40">
                    {i + 1}
                  </span>
                </div>
              )}
            </div>
            {i < total - 1 && (
              <div className="sprockets h-2.5 w-full opacity-25" aria-hidden />
            )}
          </div>
        );
      })}
    </div>
  );
}
