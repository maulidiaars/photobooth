"use client";

import { motion } from "framer-motion";

interface ResultPreviewProps {
  imageUrl: string;
}

/**
 * Shows just the finished strip — full size, no white card behind it,
 * no background — so it reads as "your actual photo", the same way
 * the landing page's film-strip mock-up floats freely with only a
 * drop shadow for depth.
 */
export function ResultPreview({ imageUrl }: ResultPreviewProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 26, rotate: -3 }}
      animate={{ opacity: 1, y: 0, rotate: -1.5 }}
      transition={{ type: "spring", stiffness: 130, damping: 15 }}
      className="animate-sway"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt="Hasil photobooth"
        className="max-h-[46vh] w-auto drop-shadow-[0_28px_46px_rgba(58,40,31,0.42)] sm:max-h-[58vh] lg:max-h-[80vh]"
      />
    </motion.div>
  );
}
