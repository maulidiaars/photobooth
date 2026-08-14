"use client";

import { motion } from "framer-motion";
import { Star, Heart, Sparkles, Scissors } from "lucide-react";

// Real portrait photos scattered around the hero like a corkboard, each
// frame in a different clay accent so the page reads "rame" without
// abandoning the garnet/cream base — the accents live in the wall, not
// the core layout.
const SHOT_CIRCLE_TL = "https://randomuser.me/api/portraits/women/65.jpg";
const SHOT_POLAROID_TR = "https://randomuser.me/api/portraits/men/32.jpg";
const SHOT_STRIP_BL_1 = "https://randomuser.me/api/portraits/women/44.jpg";
const SHOT_STRIP_BL_2 = "https://randomuser.me/api/portraits/men/75.jpg";
const SHOT_CIRCLE_BR = "https://randomuser.me/api/portraits/women/68.jpg";

/**
 * The landing page's new signature backdrop: instead of one lone photo
 * cluster docked to a side, four frames pin themselves to the corners
 * of the whole screen like a real photobooth corkboard, each a
 * different clay accent. Hidden below `lg` so mobile keeps the single
 * centered ticket composition clean.
 */
export function PhotoWall() {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 hidden lg:block">
      {/* top-left circular pinned photo — forest accent */}
      <motion.div
        initial={{ opacity: 0, scale: 0.7, rotate: -25 }}
        animate={{ opacity: 1, scale: 1, rotate: -12 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 110, damping: 14 }}
        className="animate-floaty-slow absolute left-[6%] top-[14%]"
      >
        <div className="relative h-24 w-24 overflow-hidden rounded-full border-[4px] border-forest bg-white shadow-print-sm xl:h-28 xl:w-28">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={SHOT_CIRCLE_TL} alt="" className="h-full w-full object-cover" />
        </div>
        <Heart size={18} className="fill-garnet text-garnet absolute -right-1 -top-1 drop-shadow" />
      </motion.div>

      {/* top-right taped polaroid — purple accent */}
      <motion.div
        initial={{ opacity: 0, y: -20, rotate: 20 }}
        animate={{ opacity: 1, y: 0, rotate: 10 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 110, damping: 14 }}
        className="animate-floaty absolute right-[9%] top-[10%] w-32 xl:w-36"
      >
        <div className="bg-clay-purple rounded-clay-sm p-2 pb-6 shadow-print-sm">
          <div className="bg-paper-light relative aspect-square overflow-hidden rounded-[6px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={SHOT_POLAROID_TR} alt="" className="h-full w-full object-cover" />
          </div>
        </div>
        <div className="washi-tape absolute -top-3 left-6 h-5 w-16 -rotate-6 rounded-[3px] shadow-clay-sm" />
        <Star size={20} className="fill-clay-yellowDark text-clay-yellowDark absolute -bottom-2 -right-2 drop-shadow" />
      </motion.div>

      {/* bottom-left mini filmstrip — mustard accent */}
      <motion.div
        initial={{ opacity: 0, y: 20, rotate: -14 }}
        animate={{ opacity: 1, y: 0, rotate: -7 }}
        transition={{ delay: 0.3, type: "spring", stiffness: 110, damping: 14 }}
        className="animate-floaty-delay absolute bottom-[12%] left-[8%] w-24 xl:w-28"
      >
        <div className="bg-clay-yellow rounded-clay-sm space-y-1.5 p-2 shadow-print-sm">
          <div className="bg-paper-light relative aspect-[4/3] overflow-hidden rounded-[5px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={SHOT_STRIP_BL_1} alt="" className="h-full w-full object-cover" />
          </div>
          <div className="bg-paper-light relative aspect-[4/3] overflow-hidden rounded-[5px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={SHOT_STRIP_BL_2} alt="" className="h-full w-full object-cover" />
          </div>
        </div>
        <Scissors size={16} className="text-ink/40 absolute -left-3 top-1/2 -translate-y-1/2 -rotate-90" />
      </motion.div>

      {/* bottom-right circular photo — pink accent */}
      <motion.div
        initial={{ opacity: 0, scale: 0.7, rotate: 18 }}
        animate={{ opacity: 1, scale: 1, rotate: 12 }}
        transition={{ delay: 0.4, type: "spring", stiffness: 110, damping: 14 }}
        className="animate-floaty-slow absolute bottom-[16%] right-[8%]"
      >
        <div className="border-clay-pinkDark relative h-20 w-20 overflow-hidden rounded-full border-[4px] bg-white shadow-print-sm xl:h-24 xl:w-24">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={SHOT_CIRCLE_BR} alt="" className="h-full w-full object-cover" />
        </div>
        <Sparkles size={16} className="text-garnet absolute -bottom-1 -left-1 drop-shadow" />
      </motion.div>
    </div>
  );
}
