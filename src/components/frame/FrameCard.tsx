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

/**
 * Pure "pick the frame" card: just the frame PNG (transparent bg)
 * floating on the page, no white container, no slot-count chip — the
 * frame artwork itself is the entire card, like flipping through
 * real physical frame cut-outs. Selection state is shown with a glow
 * + check badge instead of a boxed background.
 *
 * Sized by a fixed HEIGHT with the width left to auto (a plain <img>,
 * not next/image's `fill`) so a naturally tall/narrow strip frame
 * scales down proportionally instead of being forced into a fixed
 * box and reading as stretched/elongated in the carousel.
 */
export function FrameCard({ frame, selected, onSelect }: FrameCardProps) {
  return (
    <motion.button
      onClick={() => onSelect(frame)}
      whileHover={{ y: -8, scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 320, damping: 22 }}
      aria-pressed={selected}
      className="group relative flex shrink-0 snap-center flex-col items-center text-center"
    >
      <div
        className={clsx(
          "relative h-[34vh] max-h-64 min-h-40 w-auto max-w-[13rem] transition-[filter] sm:max-h-72",
          selected ? "drop-shadow-[0_18px_34px_rgba(156,43,60,0.45)]" : "drop-shadow-[0_10px_20px_rgba(58,40,31,0.22)]"
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={frame.thumbnail}
          alt={frame.nama}
          className="h-full w-auto max-w-[13rem] object-contain"
        />

        {selected && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute right-1 top-1 flex h-8 w-8 items-center justify-center rounded-full bg-garnet text-paper-light shadow-clay-sm"
          >
            <Check size={17} strokeWidth={3} />
          </motion.div>
        )}
      </div>
    </motion.button>
  );
}
