"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { Frame } from "@/types/frame";
import { FrameCard } from "./FrameCard";

interface FrameCarouselProps {
  frames: Frame[];
  selectedId: string | null;
  onSelect: (frame: Frame) => void;
}

// Dulu ini list horizontal (geser ke samping). Sekarang jadi list
// vertikal — kartu frame ditumpuk ke bawah dan area ini yang di-scroll
// ke bawah kalau frame-nya banyak; kotak pembungkus di luar
// (frame/page.tsx) tampilannya tidak diubah.
export function FrameCarousel({ frames, selectedId, onSelect }: FrameCarouselProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canUp, setCanUp] = useState(false);
  const [canDown, setCanDown] = useState(true);

  const updateArrows = () => {
    const el = scrollerRef.current;
    if (!el) return;
    setCanUp(el.scrollTop > 8);
    setCanDown(el.scrollTop < el.scrollHeight - el.clientHeight - 8);
  };

  useEffect(() => {
    updateArrows();
  }, [frames]);

  const scrollBy = (dir: 1 | -1) => {
    scrollerRef.current?.scrollBy({ top: dir * 240, behavior: "smooth" });
  };

  return (
    <div className="relative flex h-full w-full flex-col">
      <button
        aria-label="Geser ke atas"
        onClick={() => scrollBy(-1)}
        disabled={!canUp}
        className="hidden sm:flex absolute left-1/2 top-0 z-10 h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full bg-cream-light shadow-clay hover:shadow-clay-lg disabled:opacity-0 font-display text-sm text-ink transition-opacity"
      >
        ▲
      </button>

      <motion.div
        ref={scrollerRef}
        onScroll={updateArrows}
        className="no-scrollbar flex h-full min-h-0 flex-1 select-none flex-col items-center gap-4 overflow-y-auto scroll-smooth px-2 py-6"
      >
        {frames.map((frame) => (
          <FrameCard
            key={frame.id}
            frame={frame}
            selected={frame.id === selectedId}
            onSelect={onSelect}
          />
        ))}
      </motion.div>

      <button
        aria-label="Geser ke bawah"
        onClick={() => scrollBy(1)}
        disabled={!canDown}
        className="hidden sm:flex absolute bottom-0 left-1/2 z-10 h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full bg-cream-light shadow-clay hover:shadow-clay-lg disabled:opacity-0 font-display text-sm text-ink transition-opacity"
      >
        ▼
      </button>
    </div>
  );
}
