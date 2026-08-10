"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, PartyPopper, CheckCircle2 } from "lucide-react";
import { FloatingBackground } from "@/components/ui/FloatingBackground";
import { ResultPreview } from "@/components/result/ResultPreview";
import { WhatsappModal } from "@/components/result/WhatsappModal";
import { Celebration } from "@/components/ui/Celebration";
import { ClayButton } from "@/components/ui/ClayButton";
import { StepTracker } from "@/components/ui/StepTracker";
import { useSessionStore } from "@/store/sessionStore";
import { mergePhotosIntoFrame } from "@/lib/canvas";
import { savePhoto } from "@/services/photoService";
import { useToast } from "@/components/ui/Toast";
import { ROUTES } from "@/lib/constants";

type Status = "generating" | "ready" | "saving" | "saved" | "error";

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
  const [celebrate, setCelebrate] = useState(false);

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
        whatsappNumber: number,
      });
      setWhatsappNumber(number);
      setStatus("saved");
      setWaModalOpen(false);
      setCelebrate(true);
      setTimeout(() => router.push(ROUTES.finish), 1600);
    } catch {
      setStatus("ready");
      toast.push("Gagal menyimpan ke database. Coba lagi ya.", "error");
      setError("Gagal menyimpan ke database. Coba lagi ya.");
    }
  };

  return (
    <main className="app-shell relative flex w-full flex-col items-center justify-center px-5 py-4 sm:px-8">
      <FloatingBackground />
      <Celebration trigger={celebrate} />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-4 w-full max-w-5xl px-5 sm:px-8"
      >
        <StepTracker current={3} />
      </motion.div>

      {status === "generating" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-garnet/20 border-t-garnet" />
          <p className="text-muted font-body text-sm">Menggabungkan fotomu ke frame...</p>
        </div>
      )}

      {error && <p className="text-garnet font-body mb-4">{error}</p>}

      {resultImage && status !== "generating" && (
        <div className="flex w-full max-w-5xl flex-1 flex-col items-center justify-center gap-4 pt-10 lg:flex-row lg:justify-center lg:gap-10 lg:pt-0">
          {/* Kolom kiri — hasil, sebesar mungkin, tanpa background */}
          <div className="flex min-h-0 flex-[1.3] items-center justify-center">
            <ResultPreview imageUrl={resultImage} />
          </div>

          {/* Kolom kanan — judul + kontrol */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="flex w-full max-w-sm shrink-0 flex-col items-center gap-4 text-center lg:items-start lg:text-left"
          >
            <div>
              <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-semibold italic text-ink">
                Hasil photobooth-mu
              </h1>
              <p className="text-muted mt-1.5 font-body text-sm sm:text-base flex items-center justify-center gap-1.5 lg:justify-start">
                <PartyPopper size={18} className="text-garnet" strokeWidth={2.2} />
                Sudah dicetak ke frame pilihanmu
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 sm:flex-row lg:flex-col">
              <ClayButton
                variant="garnet"
                size="lg"
                fullWidth
                disabled={status === "saving"}
                onClick={handleFinishClick}
              >
                {status === "saving" ? (
                  "Menyimpan..."
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <CheckCircle2 size={20} strokeWidth={2.4} />
                    Selesai &amp; Simpan
                  </span>
                )}
              </ClayButton>
              <ClayButton
                variant="ghost"
                size="lg"
                fullWidth
                disabled={status === "saving"}
                onClick={() => router.push(ROUTES.camera)}
              >
                <span className="flex items-center justify-center gap-2">
                  <RotateCcw size={20} strokeWidth={2.4} />
                  Foto Ulang
                </span>
              </ClayButton>
            </div>
          </motion.div>
        </div>
      )}

      <WhatsappModal
        open={waModalOpen}
        submitting={status === "saving"}
        onClose={() => setWaModalOpen(false)}
        onSubmit={handleWhatsappSubmit}
      />

      <AnimatePresence>
        {status === "saved" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex items-center justify-center bg-paper/70 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 16 }}
              className="flex flex-col items-center gap-3 text-center"
            >
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-forest-gradient shadow-clay-lg">
                <CheckCircle2 size={40} className="text-ink" strokeWidth={2.4} />
              </div>
              <p className="font-display text-2xl font-semibold italic text-ink">
                Tersimpan!
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
