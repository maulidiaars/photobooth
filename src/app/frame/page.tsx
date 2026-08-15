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

// Horizontal breathing room around the frame inside the white column —
// the "margin tipis" the preview sits in on both sides.
const PREVIEW_PADDING_X = 20;

export default function FramePage() {
  const router = useRouter();
  const [frames, setFrames] = useState<Frame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const selectedFrame = useSessionStore((s) => s.selectedFrame);
  const setFrame = useSessionStore((s) => s.setFrame);

  // Live-measured render width of the selected frame's own image —
  // the white column is sized to exactly this (plus the thin padding
  // above), instead of guessing via CSS, so it always hugs the frame
  // no matter its aspect ratio.
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

  const columnWidth = previewWidth ? Math.ceil(previewWidth) + PREVIEW_PADDING_X * 2 : undefined;

  return (
    <main className="app-shell relative flex w-full flex-col overflow-hidden lg:flex-row">
      {/* LEFT — deep-maroon textured half: step tracker, title, and the
          frame carousel all live here, edge to edge with the white
          half on the right (no gap, no floating card — a hard split,
          same as the reference). Always flex-1, so it grows to eat up
          exactly whatever width the white column on the right doesn't
          need — no leftover strip of body background ever shows. */}
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

          {/* display-counter panel — cream, film-perforated top & bottom,
              holding the carousel so it reads as a lit-up booth counter
              rather than cards floating loose on the backdrop */}
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

          {/* CTA lives here only on phones/tablets, where there's no
              separate white column to anchor it to — on lg+ it moves
              into the right half below the big preview instead. */}
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

      {/* RIGHT — solid white column, sized in JS to exactly hug the
          selected frame's rendered width (see previewWidth above), not
          a fixed/CSS-guessed width — so it presses in tight around the
          frame with just a thin margin, and the "lanjut ke kamera"
          button below matches that same width. Hidden below `lg`;
          phones/tablets keep the single maroon column with the CTA
          folded back into it above. */}
      <div
        className="bg-white relative hidden min-h-0 shrink-0 flex-col items-center gap-4 pb-6 pt-6 lg:flex"
        style={{
          width: columnWidth ? `${columnWidth}px` : 280,
          maxWidth: "46vw",
          paddingLeft: PREVIEW_PADDING_X,
          paddingRight: PREVIEW_PADDING_X,
        }}
      >
        <div className="relative z-10 flex min-h-0 flex-1 items-center justify-center overflow-hidden">
          <AnimatePresence mode="wait">
            {selectedFrame ? (
              <motion.div
                key={selectedFrame.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ type: "spring", stiffness: 220, damping: 22 }}
                className="flex h-full items-center justify-center"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  ref={previewImgRef}
                  src={selectedFrame.thumbnail}
                  alt={selectedFrame.nama}
                  className="h-full w-auto max-w-full object-contain drop-shadow-[0_20px_36px_rgba(58,40,31,0.28)]"
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

        <div className="relative z-10 w-full shrink-0">
          <ContinueOutline selectedFrame={selectedFrame} onClick={handleContinue} />
        </div>
      </div>
    </main>
  );
}

/**
 * The cream ticket-stub CTA — same family as the landing page's
 * "MULAI SESI FOTO" button. Used on phones/tablets, where the button
 * sits on the maroon column, so it needs to be the cream punched-ticket
 * treatment to stay legible there.
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
 * The lg+ CTA, styled for the cream half instead: a plain garnet-bordered
 * outline button (not the punched-ticket shape) since it now sits on a
 * cream background rather than the maroon one — matches the reference's
 * bordered rectangle exactly.
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
      className="ticket ticket-on-cream rounded-clay bg-maroon-gradient shadow-clay hover:shadow-clay-lg text-paper-light flex w-full shrink-0 items-center justify-center gap-4 px-7 py-4 transition-opacity disabled:opacity-20 disabled:hover:shadow-clay sm:gap-5"
    >
      <p className="font-display text-lg font-bold tracking-wide">LANJUT KE KAMERA</p>
      <div className="ticket-divider h-8 sm:h-9" />
      <ArrowRight size={20} strokeWidth={2.4} className="shrink-0" />
    </motion.button>
  );
}