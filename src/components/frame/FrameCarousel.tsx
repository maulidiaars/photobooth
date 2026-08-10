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

export function FrameCarousel({ frames, selectedId, onSelect }: FrameCarouselProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(true);

  const updateArrows = () => {
    const el = scrollerRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 8);
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
  };

  useEffect(() => {
    updateArrows();
  }, [frames]);

  const scrollBy = (dir: 1 | -1) => {
    scrollerRef.current?.scrollBy({ left: dir * 260, behavior: "smooth" });
  };

  return (
    <div className="relative w-full">
      <button
        aria-label="Geser ke kiri"
        onClick={() => scrollBy(-1)}
        disabled={!canLeft}
        className="hidden sm:flex absolute -left-5 top-[42%] -translate-y-1/2 z-10 h-11 w-11 items-center justify-center rounded-full bg-cream-light shadow-clay hover:shadow-clay-lg disabled:opacity-0 font-display text-xl text-ink transition-opacity"
      >
        ‹
      </button>

      <motion.div
        ref={scrollerRef}
        onScroll={updateArrows}
        className="clay-scrollbar flex gap-4 overflow-x-auto snap-x snap-mandatory px-2 py-4"
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
        aria-label="Geser ke kanan"
        onClick={() => scrollBy(1)}
        disabled={!canRight}
        className="hidden sm:flex absolute -right-5 top-[42%] -translate-y-1/2 z-10 h-11 w-11 items-center justify-center rounded-full bg-cream-light shadow-clay hover:shadow-clay-lg disabled:opacity-0 font-display text-xl text-ink transition-opacity"
      >
        ›
      </button>
    </div>
  );
}
