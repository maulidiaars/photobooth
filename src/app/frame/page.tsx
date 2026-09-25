"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Sparkles, Timer } from "lucide-react";
import { FloatingBackground } from "@/components/ui/FloatingBackground";
import { FrameCarousel } from "@/components/frame/FrameCarousel";
import { StepTracker } from "@/components/ui/StepTracker";
import { SessionTimer } from "@/components/ui/SessionTimer";
import { Modal } from "@/components/ui/Modal";
import { getFrames } from "@/services/frameService";
import { useSessionStore } from "@/store/sessionStore";
import { useFrameContentBox } from "@/hooks/useFrameContentBox";
import { useFramePreviewLayout } from "@/hooks/useFramePreviewLayout";
import type { Frame } from "@/types/frame";
import { ROUTES, SESSION_DURATION_MS } from "@/lib/constants";

// Static width for the right panel only while there's no frame selected
// yet (nothing to size a preview around). The moment a frame is picked,
// the panel switches to being sized by that frame's own trimmed content
// box (see useFrameContentBox) — its real visible artwork, not the raw
// PNG canvas, which carries a transparent margin around the ticket.
const EMPTY_PANEL_WIDTH = 340;

export default function FramePage() {
  const router = useRouter();
  const [frames, setFrames] = useState<Frame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const selectedFrame = useSessionStore((s) => s.selectedFrame);
  const setFrame = useSessionStore((s) => s.setFrame);
  const sessionDeadline = useSessionStore((s) => s.sessionDeadline);
  const startSessionTimer = useSessionStore((s) => s.startSessionTimer);

  // Modal "mulai sesi" — muncul begitu masuk ke halaman ini kalau belum
  // ada timer sesi yang jalan (baru datang dari landing page). Timer-nya
  // baru benar-benar mulai begitu pengguna menutup modal ini (klik
  // "mengerti"), bukan dari sejak klik "mulai sesi foto" di halaman awal.
  const [showStartModal, setShowStartModal] = useState(sessionDeadline === null);

  const handleStartSession = () => {
    if (sessionDeadline === null) startSessionTimer();
    setShowStartModal(false);
  };

  const previewAreaRef = useRef<HTMLDivElement>(null);
  const contentBox = useFrameContentBox(selectedFrame?.thumbnail ?? null);
  const previewLayout = useFramePreviewLayout(previewAreaRef, contentBox);
  const rightColWidth = selectedFrame ? (previewLayout?.width ?? EMPTY_PANEL_WIDTH) : EMPTY_PANEL_WIDTH;

  useEffect(() => {
    getFrames()
      .then(setFrames)
      .catch(() => setError("Gagal memuat frame. Pastikan server & database aktif."))
      .finally(() => setLoading(false));
  }, []);

  const handleContinue = () => {
    if (selectedFrame) router.push(ROUTES.camera);
  };

  // Timer sesi habis sementara pengguna masih di halaman ini. Apapun
  // yang sudah terjadi itu yang kesimpen: kalau sudah sempat pilih
  // frame, langsung diarahin ke halaman hasil — walau belum sempat
  // motret sama sekali, hasilnya ya cuma frame kosong itu. Kalau
  // belum sempat pilih frame sama sekali, tidak ada apa pun yang bisa
  // disimpan jadi hasil, jadi dibiarkan saja.
  const handleTimerExpire = () => {
    if (selectedFrame) router.push(ROUTES.result);
  };

  return (
    <main className="app-shell relative flex w-full flex-col overflow-hidden lg:flex-row">
      <SessionTimer onExpire={handleTimerExpire} />

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
              Scroll ke bawah untuk lihat semua pilihan, lalu ketuk untuk memilih.
            </p>
          </motion.div>

          <div className="bg-clay-gradient shadow-print-sm flex min-h-0 w-full max-h-[54vh] flex-col rounded-[22px] px-1 py-2.5 sm:max-h-[60vh] sm:rounded-[26px] sm:py-3">
            <div className="sprockets h-2.5 w-full shrink-0 opacity-70" />

            <div className="min-h-0 flex-1">
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
            </div>

            <div className="sprockets h-2.5 w-full shrink-0 opacity-70" />
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

      {/* RIGHT — white panel whose WIDTH is derived from the selected
          frame's own trimmed content box (see useFrameContentBox /
          useFramePreviewLayout), not the raw PNG canvas ratio and not a
          fixed fraction of the viewport. Narrow frame → narrow panel →
          left column gets the freed-up space automatically because it's a
          flex-1 item. */}
      <div
        className="relative hidden min-h-0 shrink-0 flex-col bg-white lg:flex"
        style={{ width: rightColWidth, minWidth: 180, maxWidth: "62vw" }}
      >
        {/* Preview area — its height (fixed by the page layout) is what
            drives the panel's width above. The frame is rendered as a
            background-image with an explicit computed size/position
            (from useFramePreviewLayout) instead of an <img object-contain>,
            because the source PNG has a transparent margin baked around
            the actual ticket artwork — object-contain would show that
            margin as a white gap. The computed background crops it out so
            the artwork itself fills the panel edge-to-edge. */}
        <div ref={previewAreaRef} className="relative min-h-0 flex-1 bg-white">
          <AnimatePresence mode="wait">
            {selectedFrame ? (
              <motion.div
                key={selectedFrame.id}
                initial={{ opacity: 0, scale: 1.02 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.01 }}
                transition={{ type: "spring", stiffness: 220, damping: 22 }}
                className="absolute inset-0"
                style={
                  previewLayout
                    ? {
                        backgroundImage: `url(${selectedFrame.thumbnail})`,
                        backgroundSize: previewLayout.backgroundSize,
                        backgroundPosition: previewLayout.backgroundPosition,
                        backgroundRepeat: "no-repeat",
                      }
                    : undefined
                }
              >
                {!previewLayout && (
                  // First frame of layout, before height is known yet —
                  // fall back to plain object-contain for one frame so
                  // something renders immediately; useFramePreviewLayout
                  // takes over on the very next paint.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={selectedFrame.thumbnail}
                    alt={selectedFrame.nama}
                    className="block h-full w-full object-contain"
                  />
                )}
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white px-4 text-center"
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

        {/* CTA — centered and sized to its own content (not full column
            width), so it reads as a compact button sitting under the
            frame rather than a big full-width bar. */}
        <div className="relative z-10 flex w-full shrink-0 justify-center px-4 pb-4 pt-3 sm:px-6">
          <ContinueOutline selectedFrame={selectedFrame} onClick={handleContinue} />
        </div>
      </div>

      <Modal open={showStartModal} onClose={handleStartSession} title="Sesi fotomu segera dimulai">
        <div className="flex flex-col items-start gap-4">
          <div className="bg-garnet/10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full">
            <Timer size={22} strokeWidth={2.4} className="text-garnet" />
          </div>
          <p className="font-body text-sm leading-relaxed text-ink/70">
            Begitu kamu klik <span className="font-semibold text-ink">&quot;Mengerti, mulai!&quot;</span>,
            hitungan mundur <span className="font-semibold text-ink">{Math.round(SESSION_DURATION_MS / 60000)} menit</span> mulai
            berjalan sampai halaman kamera — mulai dari milih frame sampai jepret foto.
          </p>
          <p className="font-body text-sm leading-relaxed text-ink/70">
            Kalau waktunya habis, apa pun yang sudah kamu lakukan sejauh itu otomatis jadi hasil
            akhir — jadi pastikan foto-fotonya sempat diambil semua ya!
          </p>
          <button
            onClick={handleStartSession}
            className="bg-garnet-gradient text-paper-light mt-1 w-full rounded-clay-sm py-3 font-body font-semibold shadow-clay-sm transition-shadow hover:shadow-clay"
          >
            Mengerti, mulai!
          </button>
        </div>
      </Modal>
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
 * Desktop CTA — compact, content-sized (not full-width): smaller than the
 * frame above it, never wider than it.
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
      className="ticket ticket-on-cream rounded-clay bg-maroon-gradient shadow-clay hover:shadow-clay-lg text-paper-light flex w-fit max-w-full shrink-0 items-center gap-2 whitespace-nowrap px-4 py-2 shadow-[0_4px_24px_rgba(0,0,0,0.35)] transition-opacity disabled:opacity-20 disabled:hover:shadow-clay sm:gap-2.5 sm:px-5 sm:py-2.5"
    >
      <span className="font-display text-xs font-bold tracking-wide sm:text-sm">
        NEXT
      </span>
      <div className="ticket-divider h-4 sm:h-5" />
      <ArrowRight size={14} strokeWidth={2.4} className="shrink-0 sm:size-4" />
    </motion.button>
  );
}
