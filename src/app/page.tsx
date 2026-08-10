"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { FloatingBackground } from "@/components/ui/FloatingBackground";
import { FilmStripHero } from "@/components/landing/FilmStripHero";
import { ClayButton } from "@/components/ui/ClayButton";
import { APP_NAME, ROUTES } from "@/lib/constants";

export default function LandingPage() {
  return (
    <main className="app-shell relative flex w-full flex-col items-center justify-center gap-8 px-6 py-8 text-center sm:gap-10 lg:flex-row lg:justify-center lg:gap-16 lg:text-left lg:px-16 xl:gap-24">
      <FloatingBackground />

      <div className="flex flex-col items-center lg:items-start">
        <motion.p
          initial={{ opacity: 0, y: -8, rotate: -4 }}
          animate={{ opacity: 1, y: 0, rotate: -4 }}
          transition={{ delay: 0.1 }}
          className="mb-1 inline-block rounded-full bg-garnet/10 px-4 py-1 font-hand text-xl text-garnet sm:text-2xl"
        >
          selamat datang di
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 160 }}
          className="font-display text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-semibold italic text-ink leading-[1.05]"
        >
          {APP_NAME}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-4 max-w-sm text-muted font-body text-base sm:text-lg"
        >
          Pilih frame favoritmu, tersenyum di depan kamera, dan bawa pulang
          strip foto yang manis dalam hitungan menit.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="mt-7 flex flex-col items-center gap-3 sm:flex-row lg:items-start"
        >
          <Link href={ROUTES.frame}>
            <ClayButton variant="garnet" size="lg">
              Mulai Sesi Foto →
            </ClayButton>
          </Link>
          <span className="font-body text-sm text-muted">
            3 langkah simpel · ambil sampai selesai
          </span>
        </motion.div>

        {/* mini step preview, sets expectation before the flow starts */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.75 }}
          className="mt-8 hidden gap-6 font-body text-sm text-muted sm:flex"
        >
          <span className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-garnet/10 font-display text-xs font-semibold text-garnet">1</span>
            Pilih frame
          </span>
          <span className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-garnet/10 font-display text-xs font-semibold text-garnet">2</span>
            Jepret
          </span>
          <span className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-garnet/10 font-display text-xs font-semibold text-garnet">3</span>
            Unduh
          </span>
        </motion.div>
      </div>

      <div className="shrink-0">
        <FilmStripHero />
      </div>

      <Link
        href={ROUTES.adminLogin}
        className="absolute bottom-4 right-6 font-body text-xs text-muted hover:text-ink transition-colors"
      >
        Admin →
      </Link>
    </main>
  );
}
