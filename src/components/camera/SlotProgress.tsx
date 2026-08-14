"use client";

import { motion } from "framer-motion";

interface SlotProgressProps {
  total: number;
  taken: number;
}

export function SlotProgress({ total, taken }: SlotProgressProps) {
  return (
    <div className="flex items-center gap-3">
      {Array.from({ length: total }).map((_, i) => {
        const filled = i < taken;
        return (
          <motion.div
            key={i}
            initial={false}
            animate={{
              scale: filled ? 1.1 : 1,
              backgroundColor: filled ? "#FF8FAB" : "#FFFFFFAA",
            }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
            className="h-4 w-4 rounded-full shadow-clay-sm"
          />
        );
      })}
      <span className="ml-2 font-body text-sm text-white/90 drop-shadow">
        {taken}/{total} foto
      </span>
    </div>
  );
}
