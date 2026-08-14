"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Printer, RotateCcw } from "lucide-react";
import { FloatingBackground } from "@/components/ui/FloatingBackground";
import { Celebration } from "@/components/ui/Celebration";
import { useSessionStore } from "@/store/sessionStore";
import { ROUTES } from "@/lib/constants";

const AUTO_RESET_MS = 10000;

export default function FinishPage() {
  const router = useRouter();
  const resetSession = useSessionStore((s) => s.resetSession);
  const [celebrate, setCelebrate] = useState(false);

  const handleNewSession = () => {
    resetSession();
    router.push(ROUTES.home);
  };

  useEffect(() => {
    setCelebrate(true);
    const timer = setTimeout(handleNewSession, AUTO_RESET_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="landing-shell relative flex flex-col items-center justify-center px-6 py-10 text-center lg:overflow-hidden lg:py-6">
      <div className="landing-maroon-bg" />
      <FloatingBackground />
      <Celebration trigger={celebrate} />

      <div className="relative z-20 flex w-full max-w-md flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: -10, rotate: -6 }}
          animate={{ opacity: 1, y: 0, rotate: -3 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 160 }}
          className="washi-tape-solid mb-3 rounded-[3px] px-5 py-1.5 shadow-clay-sm"
        >
          <span className="text-garnet-dark font-hand text-lg sm:text-xl">
            strip fotomu udah jadi
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 150 }}
          className="text-paper-light font-display text-4xl font-semibold italic leading-[1.05] drop-shadow-[0_2px_10px_rgba(0,0,0,0.35)] sm:text-5xl"
        >
          Yeay, selesai!
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mt-5 flex w-full items-start gap-2.5 rounded-clay border border-white/15 bg-white/10 px-5 py-4 text-left shadow-clay-sm backdrop-blur-sm"
        >
          <Printer
            size={20}
            className="mt-0.5 shrink-0 text-clay-yellowDark"
            strokeWidth={2.2}
          />

          <p className="text-paper-light/85 font-body text-sm">
            Fotomu sudah tersimpan dan nomor WhatsApp kamu sudah tercatat.
            Silakan minta admin di dekat sini untuk mencetak hasil
            photobooth kamu — file mentahnya juga akan dikirim ke
            WhatsApp kamu ya.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, type: "spring", stiffness: 160 }}
          className="mt-8"
        >
          <motion.button
            onClick={handleNewSession}
            whileHover={{ y: -3, rotate: -1 }}
            whileTap={{ y: 1, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 420, damping: 22 }}
            className="ticket rounded-clay bg-clay-gradient shadow-clay hover:shadow-clay-lg text-ink flex shrink-0 items-center gap-4 px-8 py-4 sm:gap-5 sm:px-10 sm:py-4"
          >
            <div className="text-left">
              <p className="font-display text-garnet-dark text-lg font-bold tracking-wide sm:text-xl">
                MULAI SESI BARU
              </p>

              <p className="text-muted font-body mt-0.5 text-[11px] sm:text-xs">
                sesi otomatis reset sebentar lagi
              </p>
            </div>

            <div className="ticket-divider h-9 sm:h-10" />

            <RotateCcw
              size={20}
              strokeWidth={2.4}
              className="text-garnet-dark shrink-0"
            />
          </motion.button>
        </motion.div>
      </div>
    </main>
  );
}