"use client";

import { AnimatePresence, motion } from "framer-motion";
import { RotateCcw } from "lucide-react";
import { useRef, useEffect } from "react";
import type { Frame } from "@/types/frame";

interface FramePreviewLiveProps {
  frame: Frame;
  photos: string[];
  totalSlots: number;
  activeIndex: number | null;
  locked: boolean;
  onSlotClick: (index: number) => void;
  onMeasure?: (width: number) => void;
}

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

  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (imgRef.current && onMeasure) {
      const img = imgRef.current;
      if (img.naturalWidth) {
        onMeasure(img.naturalWidth);
      } else {
        const rect = img.getBoundingClientRect();
        onMeasure(rect.width);
      }
    }
  }, [onMeasure]);

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
      {/* WRAPPER - flex, ga ada gap */}
      <div className="flex h-full w-full items-center justify-center gap-0">
        
        {/* PAGER KIRI - flex-shrink-0 biar ukuran tetap */}
        <div className="h-full w-10 flex-shrink-0 overflow-hidden bg-[#f5efe6]">
          <div className="relative h-full w-full">
            <div className="absolute inset-0 bg-[#e8ddd0]" />
            <div 
              className="absolute inset-0 opacity-40 mix-blend-multiply"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
                backgroundSize: '200px 200px',
              }}
            />
            <div 
              className="absolute inset-0 opacity-25"
              style={{
                backgroundImage: `radial-gradient(circle, #9c2b3c 1.5px, transparent 1.5px)`,
                backgroundSize: '16px 16px',
              }}
            />
            <div 
              className="absolute inset-0 opacity-[0.08]"
              style={{
                backgroundImage: `repeating-linear-gradient(45deg, #3a281f 0px, #3a281f 1px, transparent 1px, transparent 12px)`,
              }}
            />
            <div className="absolute right-0 top-0 h-full w-[1px] bg-[#9c2b3c]/30" />
          </div>
        </div>

        {/* FRAME UTAMA - flex-shrink-0 biar ga ke-compress, ukuran dari parent */}
        <div
          className="relative h-full flex-shrink-0 overflow-hidden"
          style={{
            aspectRatio: "2 / 3",
            height: "100%",
            width: "auto",
          }}
        >
          <img
            ref={imgRef}
            src={frame.frame_png}
            alt=""
            aria-hidden
            className="pointer-events-none block h-full w-full select-none object-contain opacity-0"
            onLoad={(e) => {
              if (onMeasure) {
                const img = e.target as HTMLImageElement;
                onMeasure(img.naturalWidth || img.getBoundingClientRect().width);
              }
            }}
          />

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

          <img
            src={frame.frame_png}
            alt={frame.nama}
            className="pointer-events-none absolute inset-0 z-10 block h-full w-full select-none object-contain"
          />

          {slots.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-muted font-hand text-xl">frame tidak punya slot</p>
            </div>
          )}
        </div>

        {/* PAGER KANAN - flex-shrink-0 biar ukuran tetap */}
        <div className="h-full w-10 flex-shrink-0 overflow-hidden bg-[#f5efe6]">
          <div className="relative h-full w-full">
            <div className="absolute inset-0 bg-[#e8ddd0]" />
            <div 
              className="absolute inset-0 opacity-40 mix-blend-multiply"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
                backgroundSize: '200px 200px',
              }}
            />
            <div 
              className="absolute inset-0 opacity-25"
              style={{
                backgroundImage: `radial-gradient(circle, #9c2b3c 1.5px, transparent 1.5px)`,
                backgroundSize: '16px 16px',
              }}
            />
            <div 
              className="absolute inset-0 opacity-[0.08]"
              style={{
                backgroundImage: `repeating-linear-gradient(45deg, #3a281f 0px, #3a281f 1px, transparent 1px, transparent 12px)`,
              }}
            />
            <div className="absolute left-0 top-0 h-full w-[1px] bg-[#9c2b3c]/30" />
          </div>
        </div>
      </div>
    </div>
  );
}