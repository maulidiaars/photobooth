"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { FloatingBackground } from "@/components/ui/FloatingBackground";
import { FrameCarousel } from "@/components/frame/FrameCarousel";
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

  const [previewWidth, setPreviewWidth] = useState<number | null>(null);
  const roRef = useRef<ResizeObserver | null>(null);

  const previewImgRef = useCallback((node: HTMLImageElement | null) => {
    roRef.current?.disconnect();
    roRef.current = null;
    if (node) {
      const ro = new ResizeObserver((entries) => {
        const w = entries[0]?.contentRect.width;
        if (w) setPreviewWidth(w);
      });
      ro.observe(node);
      roRef.current = ro;
    }
  }, []);

  useEffect(() => {
    getFrames()
      .then(setFrames)
      .catch(() => setError("Gagal memuat frame. Pastikan server & database aktif."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedFrame) setPreviewWidth(null);
  }, [selectedFrame]);

  const handleContinue = () => {
    if (selectedFrame) router.push(ROUTES.camera);
  };

  const columnWidth = previewWidth ? Math.ceil(previewWidth) : undefined;

  return (
    <main className="app-shell relative flex w-full flex-col overflow-hidden lg:flex-row">
      {/* LEFT — deep-maroon textured half */}
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden px-5 py-4 sm:px-8 sm:py-5 lg:px-12 lg:py-7">
        <div className="landing-maroon-bg" />
        <FloatingBackground />

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 mx-auto mb-3 w-full max-w-md shrink-0 sm:mb-5"
        >
          <StepTracker current={1} theme="maroon" />
        </motion.div>

        <div className="relative z-10 flex min-h-0 flex-1 flex-col justify-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="mb-3 shrink-0 text-center sm:mb-4 lg:text-left"
          >
            <div className="washi-tape-solid mb-1.5 inline-block -rotate-2 rounded-[3px] px-3 py-0.5 shadow-clay-sm">
              <span className="text-garnet-dark font-hand text-sm sm:text-base">
                langkah satu dari tiga
              </span>
            </div>
            <h1 className="text-paper-light font-display text-2xl font-semibold italic leading-[1.05] drop-shadow-[0_2px_10px_rgba(0,0,0,0.35)] sm:text-4xl lg:text-5xl">
              Pilih frame favoritmu
            </h1>
            <p className="text-paper-light/75 font-body mt-1 text-sm sm:text-lg">
              Geser untuk lihat semua pilihan, lalu ketuk untuk memilih.
            </p>
          </motion.div>

          <div className="bg-clay-gradient shadow-print-sm min-h-0 w-full rounded-[22px] px-1 py-2.5 sm:rounded-[26px] sm:py-3">
            <div className="sprockets h-2.5 w-full opacity-70" />

            {loading && (
              <div className="flex flex-col items-center gap-3 py-8">
                <div className="border-garnet/20 border-t-garnet h-9 w-9 animate-spin rounded-full border-4" />
                <p className="text-muted font-body text-sm">Memuat frame...</p>
              </div>
            )}
            {error && <p className="text-garnet font-body py-6 text-center">{error}</p>}
            {!loading && !error && frames.length === 0 && (
              <p className="text-muted font-body py-6 text-center">
                Belum ada frame. Silakan hubungi admin untuk menambahkan frame.
              </p>
            )}
            {!loading && frames.length > 0 && (
              <FrameCarousel frames={frames} selectedId={selectedFrame?.id ?? null} onSelect={setFrame} />
            )}

            <div className="sprockets h-2.5 w-full opacity-70" />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-4 flex shrink-0 flex-col items-center gap-2 sm:mt-5 lg:hidden"
          >
            <ContinueTicket selectedFrame={selectedFrame} onClick={handleContinue} />
          </motion.div>
        </div>
      </div>

      {/* RIGHT — solid white column */}
      <div
        className="bg-white relative hidden min-h-0 shrink-0 flex-col items-center lg:flex"
        style={{
          width: columnWidth ? `${columnWidth}px` : 280,
          maxWidth: "46vw",
        }}
      >
        {/* Preview */}
        <div className="relative z-10 flex min-h-0 w-full flex-1 items-center justify-center overflow-hidden">
          <AnimatePresence mode="wait">
            {selectedFrame ? (
              <motion.div
                key={selectedFrame.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ type: "spring", stiffness: 220, damping: 22 }}
                className="flex h-full w-full items-center justify-center"
              >
                <img
                  ref={previewImgRef}
                  src={selectedFrame.thumbnail}
                  alt={selectedFrame.nama}
                  className="h-full w-full object-contain drop-shadow-[0_20px_36px_rgba(58,40,31,0.28)]"
                />
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center gap-2 px-2 text-center"
              >
                <Sparkles size={22} strokeWidth={2} className="text-ink/25" />
                <p className="text-muted font-hand text-2xl">belum ada yang dipilih</p>
                <p className="text-muted/80 font-body max-w-[16rem] text-xs">
                  Ketuk salah satu frame di sebelah kiri untuk lihat pratinjaunya di sini.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* CTA - EDITED: kasih padding di container */}
        <div className="relative z-10 w-full shrink-0 px-4 pb-4 pt-3 sm:px-6">
          <ContinueOutline selectedFrame={selectedFrame} onClick={handleContinue} />
        </div>
      </div>
    </main>
  );
}

/**
 * Cream ticket-stub CTA untuk mobile
 */
function ContinueTicket({
  selectedFrame,
  onClick,
}: {
  selectedFrame: Frame | null;
  onClick: () => void;
}) {
  return (
    <motion.button
      onClick={onClick}
      disabled={!selectedFrame}
      whileHover={selectedFrame ? { y: -3, rotate: -1 } : undefined}
      whileTap={selectedFrame ? { y: 1, scale: 0.98 } : undefined}
      transition={{ type: "spring", stiffness: 420, damping: 22 }}
      className="ticket rounded-clay bg-clay-gradient shadow-clay hover:shadow-clay-lg text-ink flex shrink-0 items-center gap-4 px-7 py-3 transition-opacity disabled:opacity-50 disabled:hover:shadow-clay sm:gap-5 sm:px-9 sm:py-3.5"
    >
      <div className="text-left">
        <p className="font-display text-garnet-dark text-base font-bold tracking-wide sm:text-lg">
          LANJUT KE KAMERA
        </p>
        <p className="text-muted font-body mt-0.5 text-[10px] sm:text-xs">
          {selectedFrame ? `frame: ${selectedFrame.nama}` : "pilih frame dulu ya"}
        </p>
      </div>
      <div className="ticket-divider h-8 sm:h-9" />
      <ArrowRight size={20} strokeWidth={2.4} className="text-garnet-dark shrink-0" />
    </motion.button>
  );
}

/**
 * Desktop CTA - EDITED: ada padding, ga mepet
 */
function ContinueOutline({
  selectedFrame,
  onClick,
}: {
  selectedFrame: Frame | null;
  onClick: () => void;
}) {
  return (
    <motion.button
      onClick={onClick}
      disabled={!selectedFrame}
      whileHover={selectedFrame ? { y: -3, rotate: -1 } : undefined}
      whileTap={selectedFrame ? { y: 1, scale: 0.98 } : undefined}
      transition={{ type: "spring", stiffness: 420, damping: 22 }}
      className="ticket ticket-on-cream rounded-clay bg-maroon-gradient shadow-clay hover:shadow-clay-lg text-paper-light flex w-full shrink-0 items-center justify-between gap-3 px-5 py-3.5 transition-opacity disabled:opacity-20 disabled:hover:shadow-clay sm:px-7 sm:py-4"
    >
      <span className="font-display text-sm font-bold tracking-wide sm:text-base">
        LANJUT KE KAMERA
      </span>
      <div className="ticket-divider h-7 sm:h-8" />
      <ArrowRight size={18} strokeWidth={2.4} className="shrink-0 sm:size-5" />
    </motion.button>
  );
}