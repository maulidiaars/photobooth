"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { PartyPopper, CheckCircle2 } from "lucide-react";
import { FloatingBackground } from "@/components/ui/FloatingBackground";
import { ResultFrameWallDesktop, ResultFrameRow } from "@/components/result/ResultFrameWall";
import { WhatsappModal } from "@/components/result/WhatsappModal";
import { StepTracker } from "@/components/ui/StepTracker";
import { useSessionStore } from "@/store/sessionStore";
import { mergePhotosIntoFrame } from "@/lib/canvas";
import { savePhoto } from "@/services/photoService";
import { useToast } from "@/components/ui/Toast";
import { ROUTES } from "@/lib/constants";

type Status = "generating" | "ready" | "saving" | "error";

export default function ResultPage() {
  const router = useRouter();
  const toast = useToast();
  const selectedFrame = useSessionStore((s) => s.selectedFrame);
  const capturedPhotos = useSessionStore((s) => s.capturedPhotos);
  const resultImage = useSessionStore((s) => s.resultImage);
  const setResultImage = useSessionStore((s) => s.setResultImage);
  const setWhatsappNumber = useSessionStore((s) => s.setWhatsappNumber);

  const [status, setStatus] = useState<Status>("generating");
  const [error, setError] = useState<string | null>(null);
  const [waModalOpen, setWaModalOpen] = useState(false);

  useEffect(() => {
    if (!selectedFrame || capturedPhotos.length === 0) {
      router.replace(ROUTES.frame);
      return;
    }
    if (resultImage) {
      setStatus("ready");
      return;
    }
    mergePhotosIntoFrame(capturedPhotos, selectedFrame.frame_png, selectedFrame.slot_layout)
      .then((dataUrl) => {
        setResultImage(dataUrl);
        setStatus("ready");
      })
      .catch(() => {
        setError("Gagal menggabungkan foto ke frame.");
        setStatus("error");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFrame, capturedPhotos]);

  const handleFinishClick = () => {
    setError(null);
    setWaModalOpen(true);
  };

  const handleWhatsappSubmit = async (number: string) => {
    if (!resultImage || !selectedFrame) return;
    setStatus("saving");
    try {
      await savePhoto({
          frame_id: selectedFrame.id,
          imageResultBase64: resultImage,
          rawPhotosBase64: capturedPhotos,
          whatsappNumber: number,
        });
      setWhatsappNumber(number);
      setWaModalOpen(false);
      // Go straight to /finish — that page is already the one big
      // "success" moment (confetti + "Yeay, selesai!"), so we don't
      // show a second checkmark/confetti overlay here first.
      router.push(ROUTES.finish);
    } catch {
      setStatus("ready");
      toast.push("Gagal menyimpan ke database. Coba lagi ya.", "error");
      setError("Gagal menyimpan ke database. Coba lagi ya.");
    }
  };

  return (
    <main className="landing-shell relative flex flex-col items-center justify-center px-6 py-10 lg:overflow-hidden lg:py-6">
      {/* same deep-maroon textured backdrop + floating dust as the
          landing page, so the last step reads as the same booth as the
          first instead of switching to a different layout language. */}
      <div className="landing-maroon-bg" />
      <FloatingBackground />
      {resultImage && <ResultFrameWallDesktop imageUrl={resultImage} />}

      <div className="relative z-20 flex w-full max-w-xl flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="-mt-2 mb-9 w-full max-w-sm sm:-mt-4 sm:mb-11"
        >
          <StepTracker current={3} theme="maroon" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: -10, rotate: -6 }}
          animate={{ opacity: 1, y: 0, rotate: -3 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 160 }}
          className="washi-tape-solid mb-3 rounded-[3px] px-5 py-1.5 shadow-clay-sm"
        >
          <span className="text-garnet-dark font-hand text-lg sm:text-xl">
            langkah tiga dari tiga
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 150 }}
          className="text-paper-light font-display text-4xl font-semibold italic leading-[1.02] drop-shadow-[0_2px_10px_rgba(0,0,0,0.35)] sm:text-5xl lg:text-6xl"
        >
          Hasil photobooth-mu
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="text-paper-light/80 font-body mt-3 flex items-center justify-center gap-1.5 text-base sm:text-lg"
        >
          <PartyPopper size={18} strokeWidth={2.2} className="shrink-0" />
          Sudah dicetak ke frame pilihanmu.
        </motion.p>

        {status === "generating" && (
          <div className="mt-8 flex flex-col items-center gap-3">
            <div className="border-paper-light/25 border-t-paper-light h-9 w-9 animate-spin rounded-full border-4" />
            <p className="text-paper-light/70 font-body text-sm">
              Menggabungkan fotomu ke frame...
            </p>
          </div>
        )}
        {error && (
          <p className="text-paper-light font-body bg-garnet/40 mt-6 rounded-clay px-4 py-2 text-sm">
            {error}
          </p>
        )}

        {status !== "generating" && (
          /* ticket-shaped CTA — same cream punched-ticket shape as the
             landing page's "MULAI SESI FOTO", so the first and last
             steps bookend each other visually. Nothing else sits
             between the subtitle and the button, same as the landing
             page's title → subtitle → CTA rhythm. */
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, type: "spring", stiffness: 160 }}
            className="mt-7"
          >
            <FinishTicket status={status} onClick={handleFinishClick} />
          </motion.div>
        )}

        {/* phones/tablets: the same strip shown four times, leaning in
            two pairs below the content — laptop keeps the side overlay
            above instead. */}
        {resultImage && <ResultFrameRow imageUrl={resultImage} />}
      </div>

      <WhatsappModal
        open={waModalOpen}
        submitting={status === "saving"}
        onClose={() => setWaModalOpen(false)}
        onSubmit={handleWhatsappSubmit}
      />
    </main>
  );
}

function FinishTicket({ status, onClick }: { status: Status; onClick: () => void }) {
  const disabled = status === "saving" || status === "generating";
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={!disabled ? { y: -3, rotate: -1 } : undefined}
      whileTap={!disabled ? { y: 1, scale: 0.98 } : undefined}
      transition={{ type: "spring", stiffness: 420, damping: 22 }}
      className="ticket rounded-clay bg-clay-gradient shadow-clay hover:shadow-clay-lg text-ink flex shrink-0 items-center gap-4 px-8 py-4 transition-opacity disabled:opacity-50 disabled:hover:shadow-clay sm:gap-5 sm:px-10 sm:py-4"
    >
      <div className="text-left">
        <p className="font-display text-garnet-dark text-lg font-bold tracking-wide sm:text-xl">
          {status === "saving" ? "MENYIMPAN..." : "SELESAI & SIMPAN"}
        </p>
        <p className="text-muted font-body mt-0.5 text-[11px] sm:text-xs">kirim ke WhatsApp-mu</p>
      </div>
      <div className="ticket-divider h-9 sm:h-10" />
      <CheckCircle2 size={22} strokeWidth={2.4} className="text-garnet-dark shrink-0" />
    </motion.button>
  );
}