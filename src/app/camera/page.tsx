"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import { Camera, CheckCircle2, RotateCcw } from "lucide-react";
import { WebcamView } from "@/components/camera/WebcamView";
import { CountdownOverlay } from "@/components/camera/CountdownOverlay";
import { ShutterFlash } from "@/components/camera/ShutterFlash";
import { SlotThumbnailsGrid } from "@/components/camera/SlotThumbnailsGrid";
import { ClayButton } from "@/components/ui/ClayButton";
import { ClayCard } from "@/components/ui/ClayCard";
import { StepTracker } from "@/components/ui/StepTracker";
import { usePhotoSession } from "@/hooks/usePhotoSession";
import { ROUTES } from "@/lib/constants";

export default function CameraPage() {
  const router = useRouter();
  const {
    webcamRef,
    videoConstraints,
    count,
    isRunning,
    showFlash,
    takeShot,
    retake,
    retakeSlot,
    retakeIndex,
    goToResult,
    capturedPhotos,
    totalSlots,
    isComplete,
    selectedFrame,
  } = usePhotoSession();

  useEffect(() => {
    if (!selectedFrame) router.replace(ROUTES.frame);
  }, [selectedFrame, router]);

  if (!selectedFrame) return null;

  return (
    <main className="app-shell flex w-full flex-col gap-3 bg-paper p-3 sm:gap-4 sm:p-5 lg:flex-row lg:p-6">
      {/* Kolom kiri — preview kamera, tombol jepret hidup di sini untuk
          semua ukuran layar (bukan cuma mobile) */}
      <section className="relative min-h-0 flex-[1.5] overflow-hidden rounded-clay-lg bg-black shadow-clay-lg">
        <WebcamView webcamRef={webcamRef} videoConstraints={videoConstraints} />
        <CountdownOverlay count={count} />
        <ShutterFlash show={showFlash} />

        <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-3 sm:p-5 bg-gradient-to-b from-black/55 to-transparent">
          <div className="rounded-full bg-white/15 backdrop-blur-md px-3 py-1.5 text-white font-display text-xs sm:text-sm font-semibold">
            {selectedFrame.nama}
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur-md px-3 py-1.5 text-white font-body text-xs sm:text-sm">
            <span className="inline-block h-2 w-2 rounded-full bg-garnet-light animate-pulse" />
            {capturedPhotos.length}/{totalSlots}
            {retakeIndex !== null && <span className="ml-1 text-garnet-light">· ulang #{retakeIndex + 1}</span>}
          </div>
        </div>

        {/* Tombol jepret — ikon kamera di atas layar kamera itu sendiri,
            klik untuk langsung jepret (dengan hitung mundur). */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 sm:bottom-6">
          {!isComplete && (
            <ClayButton
              variant="garnet"
              size="lg"
              disabled={isRunning}
              onClick={takeShot}
              aria-label="Jepret foto"
              className="rounded-full !px-7 !py-7 sm:!px-8 sm:!py-8"
            >
              {isRunning ? (
                <span className="block h-6 w-6" />
              ) : (
                <Camera size={28} strokeWidth={2.3} />
              )}
            </ClayButton>
          )}
        </div>
      </section>

      {/* Kolom kanan — info frame, progress (retake per-slot lewat hover),
          kontrol lanjut/ulang semua */}
      <section className="flex min-h-0 flex-1 flex-col gap-3 lg:max-w-sm lg:gap-4">
        <div className="shrink-0">
          <StepTracker current={2} />
        </div>

        <ClayCard bg="garnet" className="flex shrink-0 items-center gap-4 !p-3 sm:!p-4">
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-clay-sm bg-white/90 shadow-clay-inset sm:h-14 sm:w-14">
            <Image
              src={selectedFrame.thumbnail}
              alt={selectedFrame.nama}
              fill
              className="object-contain p-1"
            />
          </div>
          <div>
            <p className="font-display text-base sm:text-lg font-semibold">{selectedFrame.nama}</p>
            <p className="text-xs sm:text-sm text-paper-light/80 font-body">{totalSlots} kotak foto</p>
          </div>
        </ClayCard>

        <ClayCard bg="cream" className="min-h-0 flex-1 overflow-y-auto clay-scrollbar !p-3 sm:!p-4">
          <p className="font-hand text-lg sm:text-xl text-garnet mb-2 -mt-1">
            progress jepretan — arahkan kursor ke foto untuk ambil ulang
          </p>
          <SlotThumbnailsGrid
            total={totalSlots}
            photos={capturedPhotos}
            onRetake={retakeSlot}
            retakeIndex={retakeIndex}
            disabled={isRunning}
          />
        </ClayCard>

        {isComplete && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex shrink-0 flex-col gap-2.5"
          >
            <ClayButton variant="forest" size="md" onClick={goToResult} fullWidth>
              <span className="flex items-center justify-center gap-2">
                <CheckCircle2 size={18} strokeWidth={2.4} />
                Simpan &amp; Lanjut
              </span>
            </ClayButton>
            <ClayButton variant="ghost" size="md" onClick={retake} fullWidth>
              <span className="flex items-center justify-center gap-2">
                <RotateCcw size={18} strokeWidth={2.4} />
                Ambil Ulang Semua
              </span>
            </ClayButton>
          </motion.div>
        )}
      </section>
    </main>
  );
}
