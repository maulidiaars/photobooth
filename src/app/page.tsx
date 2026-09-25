"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { FloatingBackground } from "@/components/ui/FloatingBackground";
import { PhotoFrameWallDesktop, PhotoFrameRow } from "@/components/landing/PhotoFrameWall";
import { APP_NAME, ROUTES } from "@/lib/constants";

const STEPS = [
  { n: "1", label: "Pilih frame" },
  { n: "2", label: "Jepret" },
  { n: "3", label: "Unduh" },
];

export default function LandingPage() {
  return (
    <main className="landing-shell relative flex flex-col items-center justify-center px-6 py-10 lg:overflow-hidden lg:py-6">
      {/* deep-maroon textured backdrop, specific to this page */}
      <div className="landing-maroon-bg" />
      <FloatingBackground />
      <PhotoFrameWallDesktop />

      <div className="relative z-20 flex max-w-xl flex-col items-center text-center">
        {/* solid cream washi-tape eyebrow label — opaque so it reads
            clearly against the deep-maroon backdrop */}
        <motion.div
          initial={{ opacity: 0, y: -10, rotate: -6 }}
          animate={{ opacity: 1, y: 0, rotate: -3 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 160 }}
          className="washi-tape-solid mb-3 rounded-[3px] px-5 py-1.5 shadow-clay-sm"
        >
          <span className="text-garnet-dark font-hand text-lg sm:text-xl">
            selamat datang, jangan malu-malu
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 150 }}
          className="text-paper-light font-display text-5xl font-semibold italic leading-[0.98] drop-shadow-[0_2px_10px_rgba(0,0,0,0.35)] sm:text-6xl lg:text-7xl"
        >
          {APP_NAME}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-paper-light/80 font-body mt-4 max-w-sm text-base sm:text-lg"
        >
          Pilih frame paling kamu, pasang gaya di depan kamera, dan bawa
          pulang strip foto yang bikin nagih difoto ulang.
        </motion.p>

        {/* ticket-shaped CTA — now a cream stub punched through to the
            maroon backdrop, so it pops instead of blending in */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, type: "spring", stiffness: 160 }}
          className="mt-7"
        >
          <Link href={ROUTES.frame}>
            <motion.div
              whileHover={{ y: -3, rotate: -1 }}
              whileTap={{ y: 1, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 420, damping: 22 }}
              className="ticket rounded-clay bg-clay-gradient shadow-clay hover:shadow-clay-lg text-ink flex items-center gap-5 px-9 py-4 sm:px-11 sm:py-5"
            >
              <div className="text-left">
                <p className="font-display text-garnet-dark text-lg font-bold tracking-wide sm:text-xl">
                  MULAI SESI FOTO
                </p>
                <p className="text-muted font-body mt-0.5 text-[11px] sm:text-xs">
                  yuk · klik jepret · langsung jadi
                </p>
              </div>
              <div className="ticket-divider h-9 sm:h-10" />
              <ArrowRight size={22} strokeWidth={2.4} className="text-garnet-dark" />
            </motion.div>
          </Link>
        </motion.div>

        {/* step tracker, kept as a real numbered sequence */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-paper-light/85 font-body mt-6 flex gap-5 text-sm"
        >
          {STEPS.map((step) => (
            <span key={step.n} className="flex items-center gap-1.5">
              <span className="bg-paper-light/15 font-display text-paper-light flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold">
                {step.n}
              </span>
              {step.label}
            </span>
          ))}
        </motion.div>

        {/* phones/tablets: the frames now live here, below the text,
            instead of overlaying it — laptop keeps the side overlay above */}
        <PhotoFrameRow />
      </div>

      <Link
        href={ROUTES.adminLogin}
        className="text-paper-light/60 hover:text-paper-light relative z-30 mt-8 font-body text-xs transition-colors lg:absolute lg:bottom-4 lg:right-6 lg:mt-0"
      >
        Admin →
      </Link>
    </main>
  );
}
