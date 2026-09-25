"use client";

import { AnimatePresence, motion } from "framer-motion";
import { RotateCcw } from "lucide-react";
import type { Frame } from "@/types/frame";
import type { FrameContentBox } from "@/hooks/useFrameContentBox";
import type { FramePreviewLayout } from "@/hooks/useFramePreviewLayout";

interface FramePreviewLiveProps {
  frame: Frame;
  photos: string[];
  totalSlots: number;
  activeIndex: number | null;
  locked: boolean;
  onSlotClick: (index: number) => void;
  contentBox: FrameContentBox | null;
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

  /*
    ================================================================
    SATU SISTEM KOORDINAT DENGAN HASIL RESULT
    ================================================================

    frame.slot_layout disimpan berdasarkan KOORDINAT PNG FRAME ASLI.

    Result/canvas juga memakai:

      rect.x * frameWidth
      rect.y * frameHeight
      rect.w * frameWidth
      rect.h * frameHeight

    Jadi preview live sekarang menggunakan rumus yang sama.

    Kita TIDAK melakukan remap slot ke contentBox lagi.
    ================================================================
  */

  const naturalWidth = contentBox?.naturalWidth ?? 0;
  const naturalHeight = contentBox?.naturalHeight ?? 0;

  /*
    Posisi PNG frame asli di dalam preview.

    previewLayout.offsetX / offsetY = posisi visible artwork.

    Karena PNG punya transparent padding, posisi PNG full-nya
    harus digeser mundur sebesar posisi contentBox di dalam PNG.
  */
  const frameLeft =
    previewLayout && contentBox
      ? previewLayout.offsetX -
        contentBox.box.x * previewLayout.scale
      : 0;

  const frameTop =
    previewLayout && contentBox
      ? previewLayout.offsetY -
        contentBox.box.y * previewLayout.scale
      : 0;

  const frameWidth =
    previewLayout && naturalWidth
      ? naturalWidth * previewLayout.scale
      : undefined;

  const frameHeight =
    previewLayout && naturalHeight
      ? naturalHeight * previewLayout.scale
      : undefined;

  return (
    <div className="relative h-full w-full overflow-hidden bg-white">
      {/*
        ==============================================================
        FOTO SLOT
        ==============================================================

        Posisi foto dihitung langsung dari koordinat PNG asli.

        Ini dibuat sama dengan mergePhotosIntoFrame() sehingga
        frame dari database apa pun bisa dipakai.
      */}
      {frame.slot_layout.map((rect, i) => {
        const photo = photos[i];
        const isActive = activeIndex === i;

        const style =
          previewLayout && contentBox
            ? {
                left: `${
                  frameLeft +
                  rect.x *
                    naturalWidth *
                    previewLayout.scale
                }px`,

                top: `${
                  frameTop +
                  rect.y *
                    naturalHeight *
                    previewLayout.scale
                }px`,

                width: `${
                  rect.w *
                  naturalWidth *
                  previewLayout.scale
                }px`,

                height: `${
                  rect.h *
                  naturalHeight *
                  previewLayout.scale
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
            className="absolute z-10 overflow-hidden"
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
                  initial={{
                    opacity: 0,
                    scale: 0.82,
                  }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 20,
                  }}
                  className="group relative block h-full w-full overflow-hidden disabled:cursor-default"
                  aria-label={`Foto ${
                    i + 1
                  } — klik untuk ambil ulang`}
                >
                  <img
                    src={photo}
                    alt={`Foto ${i + 1}`}
                    className="block h-full w-full scale-[1.025] object-cover object-center"
                  />

                  {!locked && (
                    <span className="absolute inset-0 flex items-center justify-center gap-1.5 bg-ink/0 font-body text-[11px] font-semibold text-white opacity-0 transition-all duration-150 group-hover:bg-ink/60 group-hover:opacity-100 sm:text-xs">
                      <RotateCcw
                        size={13}
                        strokeWidth={2.6}
                      />
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
        Kalau frame memang tidak mempunyai slot.
      */}
      {slots.length === 0 && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-white">
          <p className="text-muted font-hand text-xl">
            frame tidak punya slot
          </p>
        </div>
      )}

      {/*
        ==============================================================
        FRAME PNG — PALING ATAS
        ==============================================================

        Ini bagian paling penting.

        Jangan pakai background-size/background-position untuk frame
        lalu foto menggunakan sistem koordinat berbeda.

        Sekarang:

            FRAME PNG
                +
            SLOT FOTO

        sama-sama menggunakan transformasi:

            natural PNG
                 ↓
              scale
                 ↓
             offset
                 ↓
             screen

        Jadi posisi preview mengikuti frame database yang sedang
        dipilih.
        ==============================================================
      */}

      {previewLayout && contentBox ? (
        <img
          src={frame.frame_png}
          alt=""
          aria-hidden="true"
          draggable={false}
          className="pointer-events-none absolute z-20 max-w-none select-none"
          style={{
            left: `${frameLeft}px`,
            top: `${frameTop}px`,
            width: `${frameWidth}px`,
            height: `${frameHeight}px`,
          }}
        />
      ) : (
        /*
          Fallback sementara ketika ukuran PNG belum selesai
          dihitung oleh browser.
        */
        <img
          src={frame.frame_png}
          alt=""
          aria-hidden="true"
          draggable={false}
          className="pointer-events-none absolute inset-0 z-20 h-full w-full select-none object-contain"
        />
      )}
    </div>
  );
}
