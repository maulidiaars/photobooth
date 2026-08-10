"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";
import { FloatingBackground } from "@/components/ui/FloatingBackground";
import { FrameCarousel } from "@/components/frame/FrameCarousel";
import { ClayButton } from "@/components/ui/ClayButton";
import { StepTracker } from "@/components/ui/StepTracker";
import { getFrames } from "@/services/frameService";
import { useSessionStore } from "@/store/sessionStore";
import type { Frame } from "@/types/frame";
import { ROUTES } from "@/lib/constants";

export default function FramePage() {
  const router = useRouter();
  const [frames, setFrames] = useState<Frame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const selectedFrame = useSessionStore((s) => s.selectedFrame);
  const setFrame = useSessionStore((s) => s.setFrame);

  useEffect(() => {
    getFrames()
      .then(setFrames)
      .catch(() => setError("Gagal memuat frame. Pastikan server & database aktif."))
      .finally(() => setLoading(false));
  }, []);

  const handleContinue = () => {
    if (selectedFrame) router.push(ROUTES.camera);
  };

  return (
    <main className="app-shell relative flex w-full flex-col px-5 py-5 sm:px-8 sm:py-6 lg:px-12 lg:py-7">
      <FloatingBackground />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto mb-4 w-full max-w-md shrink-0 sm:mb-6"
      >
        <StepTracker current={1} />
      </motion.div>

      {/* Two columns, sized so neither ever sits half-empty: left is the
          picker (fixed header + a carousel that scrolls internally if it
          ever overflows), right is a dedicated preview rail that's pure
          frame — no card chrome, no motion, just the artwork sized as
          large as the column allows. */}
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 lg:grid-cols-[1fr_340px] lg:gap-10 xl:grid-cols-[1fr_400px]">
        <div className="flex min-h-0 flex-col justify-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="mb-4 shrink-0 text-center lg:text-left"
          >
            <h1 className="font-display text-3xl font-semibold italic text-ink sm:text-4xl lg:text-5xl">
              Pilih frame favoritmu
            </h1>
            <p className="text-muted mt-1.5 font-body text-base sm:text-lg">
              Geser untuk lihat semua pilihan, lalu ketuk untuk memilih.
            </p>
          </motion.div>

          <div className="w-full">
            {loading && (
              <div className="flex flex-col items-center gap-3 py-10">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-garnet/20 border-t-garnet" />
                <p className="text-muted font-body text-sm">Memuat frame...</p>
              </div>
            )}
            {error && <p className="text-center text-garnet font-body py-8">{error}</p>}
            {!loading && !error && frames.length === 0 && (
              <p className="text-center text-muted font-body py-8">
                Belum ada frame. Silakan hubungi admin untuk menambahkan frame.
              </p>
            )}
            {!loading && frames.length > 0 && (
              <FrameCarousel frames={frames} selectedId={selectedFrame?.id ?? null} onSelect={setFrame} />
            )}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 flex shrink-0 flex-col items-center gap-2.5 text-center lg:items-start lg:text-left"
          >
            <ClayButton variant="garnet" size="lg" disabled={!selectedFrame} onClick={handleContinue}>
              Lanjut ke Kamera →
            </ClayButton>
            {!selectedFrame && (
              <p className="font-body text-sm text-muted">Pilih salah satu frame di atas dulu ya.</p>
            )}
          </motion.div>
        </div>

        {/* Preview rail — fills the entire right column height, pure
            frame artwork only (no inner animation, no floating sway) so
            it reads as a still, proportional preview rather than a
            small card lost in a big empty panel. */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="relative hidden min-h-0 flex-col lg:flex"
        >
          <p className="mb-2 flex shrink-0 items-center justify-center gap-1.5 font-hand text-2xl text-garnet">
            <Sparkles size={18} strokeWidth={2.2} />
            preview
          </p>
          <div className="relative min-h-0 flex-1 rounded-clay-lg bg-white/30 shadow-clay-inset">
            <AnimatePresence mode="wait">
              {selectedFrame ? (
                <motion.div
                  key={selectedFrame.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 220, damping: 22 }}
                  className="absolute inset-4 flex items-center justify-center"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedFrame.thumbnail}
                    alt={selectedFrame.nama}
                    className="h-full w-full object-contain drop-shadow-[0_22px_40px_rgba(58,40,31,0.3)]"
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-4 flex flex-col items-center justify-center gap-2 rounded-clay-lg border-2 border-dashed border-ink/15 text-center"
                >
                  <p className="font-hand text-2xl text-muted">belum ada yang dipilih</p>
                  <p className="max-w-[16rem] font-body text-xs text-muted">
                    Ketuk salah satu frame di sebelah kiri untuk lihat pratinjaunya di sini.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
