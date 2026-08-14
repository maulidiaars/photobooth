"use client";

import { AnimatePresence, motion } from "framer-motion";

interface CountdownOverlayProps {
  count: number | null;
}

export function CountdownOverlay({ count }: CountdownOverlayProps) {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-20">
      <AnimatePresence mode="wait">
        {count !== null && count > 0 && (
          <motion.div
            key={count}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.5, opacity: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 18 }}
            className="relative flex h-36 w-36 items-center justify-center rounded-full bg-black/25 backdrop-blur-sm"
          >
            <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="4" />
              <motion.circle
                cx="50"
                cy="50"
                r="46"
                fill="none"
                stroke="#C24759"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 46}
                initial={{ strokeDashoffset: 0 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 46 }}
                transition={{ duration: 1, ease: "linear" }}
              />
            </svg>
            <span className="font-display text-7xl font-semibold text-white text-outline-white">
              {count}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
