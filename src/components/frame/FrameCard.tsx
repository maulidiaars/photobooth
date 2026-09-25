"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import clsx from "clsx";
import type { Frame } from "@/types/frame";

interface FrameCardProps {
  frame: Frame;
  selected: boolean;
  onSelect: (frame: Frame) => void;
}

export function FrameCard({ frame, selected, onSelect }: FrameCardProps) {
  return (
    <motion.button
      onClick={() => onSelect(frame)}
      whileHover={{ y: -6, scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 320, damping: 22 }}
      aria-pressed={selected}
      className="group relative flex w-full max-w-[13rem] flex-col items-center text-center"
    >
      <div
        className={clsx(
          // Lebar mengikuti lebar kolom grid (bukan tinggi viewport lagi)
          // supaya kartu-kartu bisa sebaris penuh mengisi lebar container
          // dan konsisten tingginya lewat aspect-ratio artwork frame-nya.
          "relative aspect-[9/16] w-full transition-[filter]",
          selected ? "drop-shadow-[0_18px_34px_rgba(156,43,60,0.45)]" : "drop-shadow-[0_10px_20px_rgba(58,40,31,0.22)]"
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={frame.thumbnail}
          alt={frame.nama}
          draggable={false}
          className="h-full w-full object-contain"
        />

        {selected && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-garnet text-paper-light shadow-clay-sm sm:h-8 sm:w-8"
          >
            <Check size={16} strokeWidth={3} />
          </motion.div>
        )}
      </div>
    </motion.button>
  );
}
