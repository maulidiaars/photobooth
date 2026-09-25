"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, Sparkles } from "lucide-react";

import { WebcamView } from "@/components/camera/WebcamView";
import { CountdownOverlay } from "@/components/camera/CountdownOverlay";
import { ShutterFlash } from "@/components/camera/ShutterFlash";
import { FramePreviewLive } from "@/components/camera/FramePreviewLive";
import { FilterPicker } from "@/components/camera/FilterPicker";
import { FloatingBackground } from "@/components/ui/FloatingBackground";
import { ConfirmModal } from "@/components/ui/Modal";
import { SessionTimer } from "@/components/ui/SessionTimer";

import { usePhotoSession } from "@/hooks/usePhotoSession";
import { useFrameContentBox } from "@/hooks/useFrameContentBox";
import { useFramePreviewLayout } from "@/hooks/useFramePreviewLayout";

import type { PhotoFilterId } from "@/lib/photoFilters";
import { ROUTES } from "@/lib/constants";

export default function CameraPage() {
  const router = useRouter();

  /*
   * Index foto yang sedang dipilih untuk diambil ulang.
   */
  const [retakeCandidate, setRetakeCandidate] =
    useState<number | null>(null);

  /*
   * Effect aktif selama SATU sesi foto.
   *
   * Penting:
   * State ini tidak di-reset ketika foto selesai.
   *
   * Jadi:
   *
   * Original → Warm → B&W → Vintage
   *
   * pilihan terakhir tetap aktif walaupun semua slot sudah
   * terisi dan user ingin melakukan retake.
   */
  const [photoFilter, setPhotoFilter] =
    useState<PhotoFilterId>("original");

  const {
    webcamRef,
    videoConstraints,
    count,
    isRunning,
    isPausing,
    showFlash,
    takeAllShots,
    confirmRetake,
    activeIndex,
    goToResult,
    capturedPhotos,
    totalSlots,
    isComplete,
    selectedFrame,
  } = usePhotoSession(photoFilter);

  const previewAreaRef =
    useRef<HTMLDivElement>(null);

  const contentBox = useFrameContentBox(
    selectedFrame?.frame_png ?? null
  );

  const previewLayout =
    useFramePreviewLayout(
      previewAreaRef,
      contentBox
    );

  useEffect(() => {
    if (!selectedFrame) {
      router.replace(ROUTES.frame);
    }
  }, [selectedFrame, router]);

  if (!selectedFrame) return null;

  /*
   * Kamera sedang melakukan countdown / jeda antar foto.
   */
  const busy = isRunning || isPausing;

  /*
   * User klik salah satu foto yang sudah ada.
   *
   * Ini tidak langsung melakukan retake.
   * Kita tampilkan confirmation modal terlebih dahulu.
   */
  const handleSlotClick = (index: number) => {
    if (busy) return;

    setRetakeCandidate(index);
  };

  /*
   * User menekan "Ya, ambil ulang".
   *
   * photoFilter TIDAK diubah di sini.
   *
   * Jadi filter yang sedang dipilih tetap digunakan
   * untuk foto retake.
   */
  const handleConfirmRetake = () => {
    if (retakeCandidate !== null) {
      confirmRetake(retakeCandidate);
    }

    setRetakeCandidate(null);
  };

  const handleTimerExpire = () => {
    router.push(ROUTES.result);
  };

  /*
   * Tombol utama di dalam kamera.
   *
   * Sebelum semua foto selesai:
   *     → tombol berfungsi sebagai tombol jepret
   *
   * Setelah semua foto selesai:
   *     → tombol berubah menjadi Simpan & Lanjut
   *
   * Dengan begini tidak ada lagi tombol yang mengambil ruang
   * di bawah kamera.
   */
  const handleMainCameraButton = () => {
    if (busy) return;

    if (isComplete) {
      goToResult();
      return;
    }

    takeAllShots();
  };

  return (
    <main className="app-shell relative flex w-full flex-col overflow-hidden lg:flex-row">
      {/* =========================================================
          CAMERA AREA
          ========================================================= */}
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden px-3 pb-3 pt-3 sm:px-5 sm:pb-5 sm:pt-4 lg:px-8 lg:pb-6 lg:pt-5">
        <div className="landing-maroon-bg" />
        <FloatingBackground />

        {/* =====================================================
            TOP TOOLBAR
            Effect picker SELALU tampil selama sesi.
            
            Sebelumnya:
              !isComplete && <FilterPicker />

            Sekarang:
              FilterPicker SELALU tampil.

            Jadi ketika semua foto sudah selesai pun user masih
            bisa memilih effect baru sebelum melakukan retake.
            ===================================================== */}
        <div className="relative z-20 mb-3 flex w-full min-w-0 items-center gap-2 sm:mb-4 sm:gap-3">
          <div className="shrink-0">
            <SessionTimer
              variant="inline"
              onExpire={handleTimerExpire}
            />
          </div>

          <FilterPicker
            value={photoFilter}
            onChange={setPhotoFilter}
            disabled={busy}
          />
        </div>

        {/* =====================================================
            LIVE CAMERA
            ===================================================== */}
        <section className="relative z-10 min-h-0 flex-1 overflow-hidden rounded-clay-lg bg-black sm:rounded-[28px]">
          <WebcamView
            webcamRef={webcamRef}
            videoConstraints={videoConstraints}
            filter={photoFilter}
          />

          <CountdownOverlay count={count} />

          <ShutterFlash show={showFlash} />

          {/* Camera corner guides */}
          <div className="pointer-events-none absolute inset-3 sm:inset-5">
            {(
              [
                "top-0 left-0 border-l-2 border-t-2",
                "top-0 right-0 border-r-2 border-t-2",
                "bottom-0 left-0 border-l-2 border-b-2",
                "bottom-0 right-0 border-r-2 border-b-2",
              ] as const
            ).map((pos, i) => (
              <span
                key={i}
                className={`absolute h-6 w-6 rounded-[3px] border-white/40 sm:h-7 sm:w-7 ${pos}`}
              />
            ))}
          </div>

          {/* ===================================================
              MAIN CAMERA BUTTON
              
              BUTTON TETAP DI DALAM CAMERA.

              BELUM SELESAI:
                → tombol shutter

              SUDAH SELESAI:
                → Simpan & Lanjut

              Tidak ada lagi area tombol di bawah camera.
              =================================================== */}
          <div className="absolute bottom-5 left-1/2 z-30 -translate-x-1/2 sm:bottom-7">
            {isComplete ? (
              /*
               * =================================================
               * SIMPAN & LANJUT
               * =================================================
               */
              <motion.button
                type="button"
                onClick={handleMainCameraButton}
                disabled={busy}
                whileHover={
                  !busy
                    ? {
                        y: -2,
                        scale: 1.03,
                      }
                    : undefined
                }
                whileTap={
                  !busy
                    ? {
                        y: 1,
                        scale: 0.97,
                      }
                    : undefined
                }
                transition={{
                  type: "spring",
                  stiffness: 420,
                  damping: 22,
                }}
                className="bg-garnet-gradient flex min-h-12 items-center gap-2.5 rounded-full py-2.5 pl-3 pr-5 text-paper-light shadow-[0_12px_35px_rgba(0,0,0,.28)] backdrop-blur-md transition-opacity disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-14 sm:gap-3 sm:py-3 sm:pl-3.5 sm:pr-7"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20 sm:h-9 sm:w-9">
                  <CheckCircle2
                    size={18}
                    strokeWidth={2.6}
                  />
                </span>

                <span className="font-display text-sm font-bold tracking-wide sm:text-base">
                  Simpan &amp; Lanjut
                </span>
              </motion.button>
            ) : (
              /*
               * =================================================
               * SHUTTER
               * =================================================
               */
              <motion.button
                type="button"
                onClick={handleMainCameraButton}
                disabled={busy}
                aria-label="Mulai ambil foto"
                whileHover={
                  !busy
                    ? { scale: 1.05 }
                    : undefined
                }
                whileTap={
                  !busy
                    ? { scale: 0.9 }
                    : undefined
                }
                transition={{
                  type: "spring",
                  stiffness: 420,
                  damping: 22,
                }}
                className="group flex h-16 w-16 items-center justify-center rounded-full border-[3px] border-white/80 bg-white/10 backdrop-blur-sm transition-opacity disabled:cursor-not-allowed disabled:opacity-50 sm:h-[4.5rem] sm:w-[4.5rem]"
              >
                <motion.span
                  animate={
                    !busy
                      ? {
                          boxShadow: [
                            "0 0 0 0 rgba(194,71,89,.55)",
                            "0 0 0 12px rgba(194,71,89,0)",
                          ],
                        }
                      : undefined
                  }
                  transition={
                    !busy
                      ? {
                          duration: 1.6,
                          repeat: Infinity,
                          ease: "easeOut",
                        }
                      : undefined
                  }
                  className="bg-garnet-gradient h-[86%] w-[86%] rounded-full transition-transform group-active:scale-90"
                />
              </motion.button>
            )}
          </div>
        </section>

        {/*
         * =========================================================
         * NO BUTTON AREA HERE
         *
         * Sebelumnya:
         *
         *   [Simpan & Lanjut]
         *   ambil ulang semua
         *
         * berada di sini dan membuat layout kamera terdorong.
         *
         * Sekarang area ini sengaja DIHAPUS.
         *
         * Kamera mendapatkan seluruh ruang yang tersedia.
         * =========================================================
         */}
      </div>

      {/* =========================================================
          FRAME PREVIEW
          ========================================================= */}
      <div
        className="frame-col-dynamic-width relative flex min-h-[54vh] w-full shrink-0 flex-col overflow-hidden bg-white lg:h-full lg:min-h-0 lg:flex-shrink-0"
        style={
          previewLayout
            ? ({
                "--preview-w":
                  `${previewLayout.width}px`,
              } as React.CSSProperties)
            : undefined
        }
      >
        <div
          ref={previewAreaRef}
          className="relative min-h-0 flex-1"
        >
          {selectedFrame.slot_layout.length > 0 ? (
            <FramePreviewLive
              frame={selectedFrame}
              photos={capturedPhotos}
              totalSlots={totalSlots}
              activeIndex={activeIndex}
              locked={busy}
              onSlotClick={handleSlotClick}
              contentBox={contentBox}
              previewLayout={previewLayout}
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-white text-center">
              <Sparkles
                size={22}
                strokeWidth={2}
                className="text-ink/25"
              />

              <p className="text-muted font-hand text-2xl">
                frame ini belum punya slot
              </p>
            </div>
          )}
        </div>
      </div>

      {/* =========================================================
          RETAKE CONFIRMATION
          ========================================================= */}
      <ConfirmModal
        open={retakeCandidate !== null}
        title="Ambil ulang foto ini?"
        description={
          retakeCandidate !== null
            ? `Slot ${
                retakeCandidate + 1
              } akan difoto ulang — slot lain nggak berubah.`
            : undefined
        }
        confirmLabel="Ya, ambil ulang"
        cancelLabel="Batal"
        onConfirm={handleConfirmRetake}
        onCancel={() =>
          setRetakeCandidate(null)
        }
      />
    </main>
  );
}
