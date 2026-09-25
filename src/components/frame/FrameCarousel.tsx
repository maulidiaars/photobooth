"use client";

import { useRef } from "react";
import type { Frame } from "@/types/frame";
import { FrameCard } from "./FrameCard";
import { useDragScroll } from "@/hooks/useDragScroll";

interface FrameCarouselProps {
  frames: Frame[];
  selectedId: string | null;
  onSelect: (frame: Frame) => void;
}

// Grid selalu 4 kartu per baris — pas dengan lebar container cream-nya
// — bukan sejumlah kolom yang berubah-ubah menurut lebar layar. Kalau
// framenya lebih dari satu baris, area ini sendiri yang di-scroll ke
// bawah lewat drag (mouse/pen) atau swipe (touchscreen, bawaan
// browser); tidak ada tombol panah lagi.
export function FrameCarousel({ frames, selectedId, onSelect }: FrameCarouselProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  useDragScroll(scrollerRef, "y");

  return (
    <div
      ref={scrollerRef}
      className="no-scrollbar drag-slider-y grid h-full min-h-0 w-full select-none content-start items-start gap-2 overflow-y-auto scroll-smooth px-2 py-4 sm:gap-4 sm:py-6"
      style={{ gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}
    >
      {frames.map((frame) => (
        <FrameCard
          key={frame.id}
          frame={frame}
          selected={frame.id === selectedId}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
