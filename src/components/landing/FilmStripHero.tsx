"use client";

import { motion } from "framer-motion";
import { Sparkles, Star, Heart, PenLine } from "lucide-react";

// Real portrait photos (not an illustrated/animated placeholder) so the
// hero reads as an actual sample of what the app produces.
const STRIP_SHOTS = [
  "https://randomuser.me/api/portraits/women/65.jpg",
  "https://randomuser.me/api/portraits/men/32.jpg",
  "https://randomuser.me/api/portraits/women/44.jpg",
];
const POLAROID_SHOT = "https://randomuser.me/api/portraits/women/68.jpg";
const CIRCLE_SHOT = "https://randomuser.me/api/portraits/men/75.jpg";

/**
 * The signature visual for the landing page: a small "gallery wall" of
 * three overlapping frames — a taped photo strip up front, a loose
 * polaroid tilted behind it, and a circular pinned snapshot tucked in
 * the corner — instead of one lone strip floating in empty space, so
 * the hero itself feels full and lively rather than sparse.
 */
export function FilmStripHero() {
  return (
    <div className="relative mx-auto w-[15.5rem] sm:w-72">
      {/* Circular pinned photo — smallest, sits furthest back/top-left */}
      <motion.div
        initial={{ opacity: 0, scale: 0.7, rotate: -20 }}
        animate={{ opacity: 1, scale: 1, rotate: -14 }}
        transition={{ delay: 0.05, type: "spring", stiffness: 110, damping: 14 }}
        className="absolute -left-8 -top-3 z-0 hidden sm:block"
      >
        <div className="relative h-20 w-20 overflow-hidden rounded-full border-[3px] border-paper-light bg-white shadow-print-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={CIRCLE_SHOT} alt="" className="h-full w-full object-cover" />
        </div>
        <Star size={14} className="absolute -right-1 -top-1 fill-clay-yellowDark text-clay-yellowDark drop-shadow" />
      </motion.div>

      {/* Back frame — a single loose photo, tilted opposite the strip */}
      <motion.div
        initial={{ opacity: 0, y: 20, rotate: 4 }}
        animate={{ opacity: 1, y: 0, rotate: 9 }}
        transition={{ delay: 0.15, type: "spring", stiffness: 110, damping: 14 }}
        className="absolute -right-5 top-8 z-10 w-28 rotate-[9deg] sm:-right-8 sm:top-14 sm:w-36"
      >
        <div className="rounded-clay-sm bg-white p-2 pb-6 shadow-print-sm">
          <div className="relative aspect-square overflow-hidden rounded-[6px] bg-paper-light">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={POLAROID_SHOT} alt="" className="h-full w-full object-cover" />
          </div>
        </div>
        <Heart size={16} className="absolute -bottom-2 -left-2 fill-garnet text-garnet drop-shadow" />
      </motion.div>

      {/* Front frame — the taped-together instant photo strip */}
      <motion.div
        initial={{ opacity: 0, y: 24, rotate: -6 }}
        animate={{ opacity: 1, y: 0, rotate: -4 }}
        transition={{ delay: 0.3, type: "spring", stiffness: 120, damping: 14 }}
        className="relative z-20 w-44 animate-sway sm:w-60"
      >
        <div className="relative rounded-clay-lg bg-garnet-gradient p-2.5 pb-6 shadow-print sm:p-3 sm:pb-7">
          {/* washi tape */}
          <div className="washi-tape absolute -top-3 left-9 h-6 w-20 -rotate-6 rounded-[3px] shadow-clay-sm" />

          {/* safety pin doodle, echoing the reference frame artwork */}
          <svg
            viewBox="0 0 60 60"
            className="absolute -left-5 -top-4 h-10 w-10 -rotate-12 drop-shadow sm:-left-6 sm:-top-5 sm:h-12 sm:w-12"
            fill="none"
          >
            <path
              d="M10 42c-4-4-4-11 0-15s11-4 15 0l18 18"
              stroke="#FFFBF2"
              strokeWidth="3.2"
              strokeLinecap="round"
            />
            <circle cx="46" cy="48" r="6" fill="none" stroke="#FFFBF2" strokeWidth="3.2" />
            <path d="M8 40 L44 12" stroke="#FFFBF2" strokeWidth="3.2" strokeLinecap="round" />
          </svg>

          {STRIP_SHOTS.map((src, i) => (
            <div
              key={i}
              className="relative mb-2 aspect-[4/3] overflow-hidden rounded-clay-sm bg-paper-light shadow-clay-inset last:mb-0 sm:mb-2.5"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-full w-full object-cover" />
              <Sparkles size={14} className="absolute bottom-1.5 right-2 text-white drop-shadow sm:h-4 sm:w-4" strokeWidth={2.4} />
            </div>
          ))}

          <p className="mt-2.5 text-center font-hand text-xl leading-none text-paper-light sm:mt-3 sm:text-2xl">
            kamu, di sini
          </p>
        </div>

        {/* star sticker */}
        <motion.span
          className="absolute -right-3 bottom-7 sm:-right-4 sm:bottom-8"
          animate={{ rotate: [0, 15, 0], scale: [1, 1.12, 1] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <Star size={26} className="fill-clay-yellowDark text-clay-yellowDark drop-shadow sm:h-[30px] sm:w-[30px]" />
        </motion.span>

        {/* handwritten squiggle note, pointing at the strip like a note
            pinned to it — the "rame" finishing touch that makes the
            cluster feel like a real curated corkboard, not one lone card */}
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="absolute -left-9 top-1/2 hidden -translate-y-1/2 -rotate-12 items-center gap-1 font-hand text-lg text-garnet sm:flex"
        >
          <PenLine size={14} className="rotate-90" strokeWidth={2} />
          coba yuk
        </motion.span>
      </motion.div>
    </div>
  );
}
