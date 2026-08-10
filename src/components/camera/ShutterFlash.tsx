"use client";

import { AnimatePresence, motion } from "framer-motion";

interface ShutterFlashProps {
  show: boolean;
}

export function ShutterFlash({ show }: ShutterFlashProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          className="pointer-events-none absolute inset-0 z-30 bg-white"
        />
      )}
    </AnimatePresence>
  );
}
